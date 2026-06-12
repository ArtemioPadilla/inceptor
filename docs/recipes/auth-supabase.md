# Recipe — Auth + DB con Supabase

Auth email/password + Postgres con Row Level Security, **sin escribir auth
propia ni manejar contraseñas**. Validado en FinSight AI.

## Cuándo
Casi cualquier producto real: usuarios, datos privados por usuario. Supabase da
auth + DB + RLS en un servicio; el frontend habla con él vía `@supabase/supabase-js`.

## Arquitectura clave
- El **frontend** escribe/lee la DB con la **sesión del usuario** → RLS aísla
  por usuario. **No se usa la service key en ningún servidor.**
- Un backend (si lo hay) queda **stateless** (solo cómputo).

## 1. Instalar + env

```bash
npm i @supabase/supabase-js
```

`.env` (todo `PUBLIC_` va al browser — la *publishable/anon key* es segura; la
`sb_secret_…`/`service_role` **nunca** va aquí):

```env
PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

## 2. Cliente guardado — `src/lib/supabase.ts`

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = ((import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) ?? '').trim();
const anonKey = ((import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? '').trim();

export const supabaseEnabled = url.length > 0 && anonKey.length > 0;

// Guarded: si faltan las env (build sin secretos), `supabase` es null y la UI
// muestra un aviso en vez de romper el build.
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
```

## 3. Sesión cross-island — `src/stores/auth.ts` (Nano Stores, no Context)

```ts
import { atom, onMount } from 'nanostores';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const $session = atom<Session | null>(null);
export const $authReady = atom<boolean>(false);

onMount($session, () => {
  if (!supabase) { $authReady.set(true); return; }
  supabase.auth.getSession().then(({ data }) => { $session.set(data.session); $authReady.set(true); });
  const { data } = supabase.auth.onAuthStateChange((_e, s) => $session.set(s));
  return () => data.subscription.unsubscribe();
});
```

## 4. Schemas (Spec-DD) — `src/schemas/auth.ts`

```ts
import { z } from 'zod';
export const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});
export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
```

## 5. Islas (resumen)

`RegisterForm` (react-hook-form + zod):
```ts
const { data, error } = await supabase!.auth.signUp({
  email, password, options: { data: { name }, emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}` },
});
if (error) { /* "already registered" → correo duplicado */ }
else if (data.session) location.href = withBase('/app/');   // confirm-email OFF
else /* mostrar "revisa tu correo" */;                       // confirm-email ON
```

`LoginForm`:
```ts
const { error } = await supabase!.auth.signInWithPassword({ email, password });
if (error) setError('Correo o contraseña incorrectos.');     // sin enumerar usuarios
else location.href = withBase('/app/');
```

`AuthNav` (header): `useStore($session)` → muestra email + "Salir"
(`supabase.auth.signOut()`) o links a `/login` `/registro`.

Monta las islas con `client:only="react"` (no necesitan SSR).

## 6. Tablas + RLS — `supabase/migrations/0001_init.sql`

```sql
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  -- … tus columnas …
  created_at timestamptz not null default now()
);
alter table public.items enable row level security;
create policy "own items" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

`default auth.uid()` → el frontend ni pasa `user_id`; RLS lo valida.

## 7. Persistir desde el frontend (no desde un servidor)

```ts
await supabase!.from('items').insert({ /* tus campos */ });   // user_id automático
const { data } = await supabase!.from('items').select('*');   // RLS filtra a este usuario
```

## 8. Config del dashboard (una vez)
- **Authentication → Providers → Email**: on.
- **Authentication → URL Configuration**: Site URL = la URL desplegada; Redirect
  URLs += `http://localhost:4321/**` (si no, el correo de confirmación va a `localhost:3000`).
- **Confirm email**: apágalo para un demo sin fricción.

## Gotchas (vividos en FinSight)
- En Astro las vars del cliente llevan prefijo `PUBLIC_` (no `VITE_`).
- El correo de confirmación regresa al **Site URL** → configúralo o pasa `emailRedirectTo`.
- Migraciones por CI: ver [supabase-migrations-ci.md](./supabase-migrations-ci.md).

## 8. Gating de rutas y roles — usa el scaffold, no checks ad-hoc

No escribas comprobaciones de rol/flag inline en cada isla. El módulo único
de gating es `src/lib/route-guard.tsx` (regla en CLAUDE.md § "Auth gating
rules"). Adapta el usuario de Supabase a `GuardUser` UNA vez, en el límite
del contexto:

```tsx
import { RouteGuard, type GuardUser } from '@/lib/route-guard';
import { useAuth } from '@/stores/auth'; // tu contexto/nanostore de sesión

function toGuardUser(session: Session | null): GuardUser | null {
  if (!session) return null;
  return {
    id: session.user.id,
    roles: session.user.app_metadata?.roles ?? [],      // allowlist explícito
    flags: { verified: session.user.email_confirmed_at != null },
  };
}

export default function AdminIsland() {
  const session = useAuth();
  return (
    <RouteGuard user={toGuardUser(session)} allow={['admin']} requireFlags={['verified']} fallback={<SignInPrompt />}>
      <AdminPanel />
    </RouteGuard>
  );
}
```

Reglas duras: allowlists / `=== true` (nunca `!== false` — un campo ausente
lo pasa), identidad siempre del contexto (nunca props/placeholders), y
denegar por defecto. El test unitario del scaffold asegura el caso del
campo ausente.
