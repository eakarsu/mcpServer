#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"

for required in REFERENCE_STATUS.md SECURITY.md .env.example start.sh scripts/archive-notice.js; do
  test -f "$required"
done

environment_files=$(git ls-files --cached --others --exclude-standard |
  grep -E '(^|/)\.env($|\.)' |
  grep -Ev '(^|/)\.env\.example$' || true)
if [ -n "$environment_files" ]; then
  echo "Tracked environment file violates archive policy" >&2
  exit 1
fi

test ! -e .gitleaksignore
retired_demo_password='admin''123'
if rg -n "$retired_demo_password" . --glob '!package-lock.json' --glob '!_COMPLETENESS_REVIEW.md'; then
  echo "Known demo password remains in tracked source" >&2
  exit 1
fi
if rg -n 'kill -9|brew services start|npm install' start.sh; then
  echo "Retired destructive launcher behavior remains" >&2
  exit 1
fi
rg -q 'MCP_REFERENCE_ACKNOWLEDGEMENT' backend/server.js
rg -q 'MCP_REFERENCE_ACKNOWLEDGEMENT' backend/seeds/seed.js

expect_archive_exit() {
  set +e
  "$@" >/dev/null 2>&1
  status=$?
  set -e
  test "$status" -eq 78
}

expect_archive_exit ./start.sh
expect_archive_exit node scripts/archive-notice.js
expect_archive_exit node backend/server.js
expect_archive_exit node backend/seeds/seed.js

node - <<'NODE'
const fs = require("node:fs");
const backend = JSON.parse(fs.readFileSync("backend/package.json", "utf8")).scripts;
const frontend = JSON.parse(fs.readFileSync("frontend/package.json", "utf8")).scripts;
for (const [name, scripts] of [["backend", backend], ["frontend", frontend]]) {
  for (const command of ["start", ...(name === "backend" ? ["dev", "seed"] : ["build"])]) {
    if (scripts[command] !== "node ../scripts/archive-notice.js") {
      throw new Error(`${name} ${command} does not fail closed`);
    }
  }
}
NODE

find backend -type f -name '*.js' -not -path '*/node_modules/*' -print0 |
  xargs -0 -n 1 node --check

git diff --check
echo "Archive policy verified"
