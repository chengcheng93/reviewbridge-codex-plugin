# ReviewBridge Codex plugin

This plugin exposes a direct Claude Code launcher and two Codex skills: `review` and `setup`.
It is distributed from the standalone `reviewbridge-codex-plugin` repository.

From the plugin directory:

```bash
./bin/reviewbridge.mjs doctor --json
printf '%s' 'Review the current changes and return structured JSON.' | ./bin/reviewbridge.mjs review
```

The launcher checks `CLAUDE_CODE_BIN` first, then `PATH`, then common local Claude Code install
locations. Set `CLAUDE_CODE_BIN` to an absolute executable path when Claude Code is installed in a
custom location:

```bash
CLAUDE_CODE_BIN=/absolute/path/to/claude ./bin/reviewbridge.mjs doctor --json
```

The `review` skill invokes the adjacent `skills/review/scripts/invoke.mjs` by its absolute loaded
skill path, so it does not depend on the current working directory or plugin cache directory.

## GitHub installation

Teammates can add the standalone GitHub marketplace and install the plugin without copying the
worktree:

```bash
codex plugin marketplace add https://github.com/chengcheng93/reviewbridge-codex-plugin.git
codex plugin add reviewbridge@reviewbridge
```

The repository marketplace is declared in `.agents/plugins/marketplace.json`. After installation,
start a new Codex thread so the new skills are loaded.
