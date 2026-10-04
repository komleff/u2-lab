#!/usr/bin/env python3
"""Проверяет только project-owned bootstrap authority, маршруты и pinned metadata."""
import json
import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
SOURCE_COMMIT = 'cdc490e3517c8455f662f82579c45813cdbb9a76'
PRODUCT = 'docs/product/power-heat-lab-v0.1.md'
SOURCE = 'docs/architecture/source-authority.md'
INVENTORY = 'docs/architecture/u2-source-inventory.json'
BOOTSTRAP_PLAN = 'docs/plans/2026-10-05-overgate-bootstrap.md'
PRODUCT_PLAN = 'docs/plans/2026-10-05-u2-lab-launch.md'
BOOTSTRAP_CONTRACT = 'docs/verification/bootstrap-contract.md'
PRODUCT_CONTRACT = 'docs/verification/power-heat-v0.1-contract.md'
MEMORY = ('activeContext', 'progress', 'projectbrief', 'productContext', 'techContext', 'systemPatterns')
errors = []


def fail(message):
    errors.append(message)


def read(path):
    target = ROOT / path
    if target.is_symlink() or not target.is_file() or not target.resolve().is_relative_to(ROOT):
        fail(f'missing/unsafe owner: {path}')
        return ''
    try:
        body = target.read_text(encoding='utf-8')
    except (OSError, UnicodeError) as error:
        fail(f'unreadable owner: {path}: {error}')
        return ''
    if not body.strip():
        fail(f'empty owner: {path}')
    return body


def require(body, values, owner):
    for value in values:
        if value not in body:
            fail(f'missing authority/route in {owner}: {value}')


def check():
    agents = read('AGENTS.md')
    require(agents, ('Dmitriy Komlev', 'komleff', '.memory-bank/activeContext.md',
                     'docs/INDEX.md', '.agents/PM_ROLE.md', '.agents/project/verify.sh'), 'AGENTS.md')
    authority = read('.agents/project/authority.md')
    require(authority, ('Dmitriy Komlev', 'komleff', PRODUCT, SOURCE), '.agents/project/authority.md')
    index = read('docs/INDEX.md')
    paths = (PRODUCT, SOURCE, INVENTORY, BOOTSTRAP_PLAN, PRODUCT_PLAN,
             BOOTSTRAP_CONTRACT, PRODUCT_CONTRACT)
    bodies = {path: read(path) for path in paths}
    for path in paths:
        require(index, (f']({path.removeprefix("docs/")})',), 'docs/INDEX.md')
    routes = {
        BOOTSTRAP_PLAN: ('../verification/bootstrap-contract.md',),
        PRODUCT_PLAN: ('../product/power-heat-lab-v0.1.md', '../verification/power-heat-v0.1-contract.md'),
        PRODUCT: ('../architecture/source-authority.md',),
        PRODUCT_CONTRACT: ('../product/power-heat-lab-v0.1.md',),
        BOOTSTRAP_CONTRACT: ('AGENTS.md', 'Product runtime OUT OF SCOPE'),
        SOURCE: ('docs/INDEX.md', 'docs/architecture/', 'u2-source-inventory.json', SOURCE_COMMIT),
    }
    for owner, values in routes.items():
        require(bodies[owner], values, owner)
    memory = {name: read(f'.memory-bank/{name}.md') for name in MEMORY}
    require(memory['projectbrief'], ('U2 Lab', 'komleff/u2-lab', 'U2'), '.memory-bank/projectbrief.md')
    require(memory['activeContext'], ('U2',), '.memory-bank/activeContext.md')
    require(memory['techContext'], ('633937250fa8f47b49f928c1d8781ab17fe8c8e3',), '.memory-bank/techContext.md')
    try:
        inventory = json.loads(bodies[INVENTORY])
        if inventory.get('repository') != 'komleff/u2':
            fail('source inventory repository must be komleff/u2')
        commit = inventory.get('commit')
        if not isinstance(commit, str) or not re.fullmatch('[0-9a-f]{40}', commit) or commit != SOURCE_COMMIT:
            fail('source inventory commit must match pinned exact40hex U2 commit')
        if inventory.get('route') != ['docs/INDEX.md', 'docs/architecture/ADR-INDEX.md']:
            fail('source inventory route must explicitly start at docs/INDEX.md then ADR-INDEX.md')
        owners = inventory.get('owners')
        if not isinstance(owners, list) or not owners:
            raise ValueError('owners must be a nonempty list')
        seen = set()
        for owner in owners:
            if not isinstance(owner, dict):
                raise ValueError('owner must be an object')
            path = owner.get('path')
            if (not isinstance(path, str) or not path.startswith('docs/') or
                    '..' in PurePosixPath(path).parts or '\\' in path or
                    str(PurePosixPath(path)) != path or not path.endswith('.md') or path in seen):
                fail(f'invalid/duplicate source owner path: {path}')
                continue
            seen.add(path)
            blob = owner.get('blob')
            if not isinstance(blob, str) or not re.fullmatch('[0-9a-f]{40}', blob):
                fail(f'source owner blob must be exact40hex: {path}')
            if not isinstance(owner.get('version'), str) or not owner['version'].strip():
                fail(f'missing source owner version: {path}')
            expected_status = 'primary' if path.endswith('/ADR-INDEX.md') else 'active'
            if owner.get('status') != expected_status:
                fail(f'invalid current source owner status: {path}')
        expected = set(re.findall(r'docs/(?:brand|specs|gdd)/[A-Za-z0-9_./-]+\.md', bodies[SOURCE]))
        expected.update('docs/architecture/' + name for name in
                        re.findall(r'ADR-\d{4}-[A-Za-z0-9_-]+\.md', bodies[SOURCE]))
        expected.add('docs/architecture/ADR-INDEX.md')
        if seen != expected:
            fail(f'source owner route mismatch: missing={sorted(expected-seen)}, extra={sorted(seen-expected)}')
    except (ValueError, TypeError, AttributeError) as error:
        fail(f'invalid source inventory: {error}')
    for error in errors:
        print(f'bootstrap project: FAIL: {error}')
    print(f'bootstrap project authority/source metadata: {"FAIL" if errors else "PASS"}')
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(check())
