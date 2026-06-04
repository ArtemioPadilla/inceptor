# Recipe — Feature de IA con BYOK

Patrón para añadir una feature de IA (p. ej. "analiza este documento con Claude")
**sin pagar ni centralizar una API key**: el usuario trae la suya (BYOK).
Validado en FinSight AI (extracción + categorización de PDFs).

## Idea
- **BYOK** = *Bring Your Own Key*. El usuario pega su API key de Anthropic; vive
  solo en su navegador (`sessionStorage`), se manda por request al backend, y el
  backend la usa de forma **transitoria** — **nunca la loguea ni la persiste**.
- El backend es **stateless**: recibe input + key, devuelve resultado. No DB, no
  secretos. (La persistencia, si la hay, la hace el frontend → ver auth-supabase.)
- Ventaja: cero costo/secreto para ti, y mejor privacidad (la key no toca tu infra de forma persistente).

## 1. Store de la key — `src/stores/apiKey.ts`

```ts
import { atom } from 'nanostores';
const KEY = 'app_anthropic_key';
function read() { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } }

export const $anthropicKey = atom<string>(typeof window !== 'undefined' ? read() : '');
export function setAnthropicKey(v: string) {
  const t = v.trim(); $anthropicKey.set(t);
  try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch {}
}
```

## 2. Isla `ApiKeyField` (resumen)
Input `type="password"` + `setAnthropicKey(value)`; muestra estado "configurada"
+ botón "Quitar"; aviso: *"se guarda solo en esta pestaña, no en el servidor"*.

## 3. Llamada desde el frontend
```ts
const body = new FormData(); body.append('file', file);
const res = await fetch(apiUrl('/api/extract'), {
  method: 'POST',
  headers: { 'X-Anthropic-Key': $anthropicKey.get() },   // BYOK por header
  body,
});
```
(`apiUrl`/`apiEnabled` salen de `src/lib/api.ts` — backend opt-in vía `PUBLIC_API_BASE`.)

## 4. Backend stateless (Flask) — helper aislado y mockeable

```python
# extract.py
def call_claude(api_key: str, model: str, text: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)        # key transitoria, no se guarda
    msg = client.messages.create(model=model, max_tokens=4096,
        messages=[{"role": "user", "content": PROMPT.format(text=text)}])
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
```

Ruta: lee `X-Anthropic-Key` (401 si falta), procesa, devuelve JSON validado con
Pydantic. Mapea errores de auth de Anthropic → 401 "key inválida".

```python
api_key = request.headers.get("X-Anthropic-Key", "").strip()
if not api_key:
    return jsonify({"error": "no_api_key"}), 401
# … nunca: print(api_key) / logging de la key …
```

## 5. Tests sin red ni key real (monkeypatch)
Aísla `call_claude` para mockearla:
```python
def test_extract_happy(client, monkeypatch):
    monkeypatch.setattr(extract, "call_claude", lambda k, m, t: '[{"fecha":"2026-05-03","descripcion":"OXXO","monto":50,"tipo":"cargo"}]')
    res = client.post("/api/extract", data={"file": (pdf, "x.pdf", "application/pdf")},
                      headers={"X-Anthropic-Key": "test"}, content_type="multipart/form-data")
    assert res.status_code == 200
```

## Reglas de oro
- **Nunca** pongas la key en un `PUBLIC_` var ni en logs ni en la DB.
- `sessionStorage` (se borra al cerrar la pestaña), no `localStorage`.
- El modelo es configurable por env (`ANTHROPIC_MODEL`); valida que la cuenta del
  usuario tenga acceso (un 404 de modelo es el error más común).
- Dónde corre el backend: ver [ai-backend-hosting.md](./ai-backend-hosting.md).
