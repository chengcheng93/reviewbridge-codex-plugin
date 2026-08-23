---
name: setup
description: Check whether ReviewBridge can locate a usable Claude Code executable.
---

# ReviewBridge Setup

Resolve the absolute directory where Codex loaded this `SKILL.md`, then invoke its adjacent
`scripts/invoke.mjs` with Node and `doctor --json`.

If discovery is blocked, set `CLAUDE_CODE_BIN` to the absolute Claude Code executable path and run the command again.
