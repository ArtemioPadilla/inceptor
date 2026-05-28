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
docker run --rm \
  -v "$PWD":/work \
  -w /work \
  -u "$(id -u):$(id -g)" \
  "$IMAGE" \
  bash -c "npm ci && npm run build && npx playwright test --update-snapshots"

echo
echo "✓ Baselines refreshed. Next steps:"
echo "  1. git diff --stat tests/__screenshots__/      # what changed"
echo "  2. git add tests/__screenshots__/"
echo "  3. git commit -m 'test(visual): refresh baselines in Linux Docker'"
echo "  4. Open a PR and verify .github/workflows/visual.yml goes green"
echo "  5. In that PR, remove 'continue-on-error: true' from visual.yml:39"
