#!/usr/bin/env bash
# Levanta el backend Flask (server-flask/) en local de un comando:
#   npm run server:flask      (o)   bash scripts/dev-flask.sh
# Crea/reutiliza un venv en server-flask/.venv, instala deps y corre Flask.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/server-flask"

# Python con wheels disponibles: pydantic-core no compila bien en 3.14 todavía;
# 3.11–3.13 traen wheels precompiladas.
PY=""
for c in python3.12 python3.11 python3.13 python3; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "✗ No Python found. Install 3.11–3.13 (or use: docker compose --profile backend-flask up)." >&2
  exit 1
fi

if [ ! -d .venv ]; then
  echo "→ Creating venv with $PY…"
  "$PY" -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
echo "→ Installing dependencies…"
pip install --quiet --disable-pip-version-check -r requirements.txt

PORT="${PORT:-8787}"
echo "✓ Flask archetype → http://localhost:${PORT}  (Ctrl+C to stop)"
exec flask --app app run --port "${PORT}"
