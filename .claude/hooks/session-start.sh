#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions. Local sessions
# already have a working environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install dependencies so typecheck/test/build work during the session.
npm install
