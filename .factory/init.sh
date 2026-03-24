#!/bin/sh
set -eu

ROOT="/Users/Kosta/worktrees/office-agents-hybrid/codex-word-system-polish"

if [ ! -d "$ROOT/node_modules" ]; then
  pnpm -C "$ROOT" install
fi

mkdir -p "$ROOT/.factory/library" "$ROOT/.factory/skills"
