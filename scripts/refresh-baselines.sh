#!/usr/bin/env bash
# Refresh Playwright visual baselines inside the same Linux image CI uses.
#
# Why: visual baselines are pixel-stable only within the same OS + font stack
# they were captured in. macOS-captured baselines drift in CI's Linux runners.
# Running the snapshot pass inside the official Playwright Docker image
# eliminates the drift permanently.
#
# Usage:
#   bash scripts/refresh-baselines.sh
#
# After it finishes, commit the updated tests/__screenshots__/ files, push,
# and remove `continue-on-error: true` from .github/workflows/visual.yml.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"

if ! command -v docker >/dev/null 2>&1; then
  echo "✗ docker is not installed."
  echo "  Install Docker Desktop (https://docs.docker.com/get-docker/) or"
  echo "  colima (https://github.com/abiosoft/colima) for a lighter local engine."
  exit 1
fi

echo "▶ Pulling $IMAGE (one-time download, ~600 MB)…"
docker pull "$IMAGE"

echo "▶ Running snapshot pass inside container…"
# Two hard-won details:
#  - HOME/npm_config_cache must be writable inside the container or npm ci
#    dies on '/.npm' permissions (and the failure is easy to miss).
#  - node_modules must be an anonymous volume, NOT the host's macOS tree:
#    npm ci replacing a bind-mounted node_modules races on virtiofs (esbuild
#    install.js ENOENT mid-swap). The container installs its own Linux tree;
#    only tests/__screenshots__ lands back on the host.
# On Docker Desktop (macOS) bind-mount writes map to the host user; on native
# Linux add `-u "$(id -u):$(id -g)"` back and pre-create the volume ownership.
docker run --rm \
  -v "$PWD":/work \
  -v /work/node_modules \
  -w /work \
  -e HOME=/tmp \
  -e npm_config_cache=/tmp/.npm \
  "$IMAGE" \
  bash -c "npm ci --no-audit --no-fund && npm run build && npx playwright test --update-snapshots"

echo
echo "✓ Baselines refreshed. Next steps:"
echo "  1. git diff --stat tests/__screenshots__/      # what changed"
echo "  2. git add tests/__screenshots__/"
echo "  3. git commit -m 'test(visual): refresh baselines in Linux Docker'"
echo "  4. Open a PR and verify .github/workflows/visual.yml goes green"
echo "  5. In that PR, remove 'continue-on-error: true' from visual.yml:39"
