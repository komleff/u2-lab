#!/usr/bin/env bash
set -euo pipefail
# Проверки запускаются из корня, чтобы результат не зависел от cwd вызывающего hook.
PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd -- "$PROJECT_ROOT"
printf '%s\n' 'Native hook activation: NOT RUN (requires actual native adapter smoke)'
npm run typecheck
npm test
npm run build
npm run test:browser
python3 scripts/check-reference.py
python3 .agents/project/check-bootstrap.py
node --test scripts/tests/test-bd-cloud.mjs
bash -n scripts/bd-apply-intents.sh
printf '%s\n' 'Bootstrap structural/project checks: PASS'
