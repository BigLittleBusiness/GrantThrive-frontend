#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to run the frontend." >&2
  exit 1
fi

pnpm install --frozen-lockfile
exec pnpm dev