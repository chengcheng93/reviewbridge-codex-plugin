---
name: review
description: Run an independent Claude Code review through the bundled ReviewBridge launcher. Use when the user asks for a cross-model review of the current work.
---

# ReviewBridge Review

Resolve the absolute directory where Codex loaded this `SKILL.md`, then invoke its adjacent
`scripts/invoke.mjs` with Node and the `review` subcommand. Pass the review request through stdin
or `--prompt-file`; never interpolate it into a shell command.

The launcher returns Claude Code's structured JSON output and a non-zero status when Claude Code cannot be found or exits unsuccessfully.
