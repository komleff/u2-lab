#!/usr/bin/env bash
set -euo pipefail
# Проверки запускаются из корня, чтобы результат не зависел от cwd вызывающего hook.
PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd -- "$PROJECT_ROOT"
# Отсутствующий runtime не должен превращать структурную проверку в product PASS.
printf '%s\n' 'Product typecheck/unit/build/browser: NOT RUN (bootstrap stage)' 'Native hook activation: NOT RUN (requires actual native adapter smoke)'
python3 scripts/check-reference.py
python3 .agents/project/check-bootstrap.py
printf '%s\n' 'Bootstrap structural/project checks: PASS'
