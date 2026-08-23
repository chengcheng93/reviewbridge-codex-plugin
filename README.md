# ReviewBridge Codex Plugin

ReviewBridge is a standalone Codex plugin that launches the locally installed
Claude Code CLI for an independent review. The launcher accepts a review prompt
from stdin or a prompt file and returns Claude Code's JSON output.

ReviewBridge is an explicit review tool. It does not automatically block Codex
delivery or bundle a larger feature-delivery workflow.

## Install from GitHub

```bash
codex plugin marketplace add https://github.com/chengcheng93/reviewbridge-codex-plugin.git
codex plugin add reviewbridge@reviewbridge
```

Start a new Codex task after installation so the new skills are loaded.

## Use from Codex

```text
$reviewbridge:setup
$reviewbridge:review Review the current changes for security, error handling, and test coverage.
```

## Use from a terminal

```bash
REVIEWBRIDGE=/absolute/path/to/plugins/reviewbridge
$REVIEWBRIDGE/bin/reviewbridge.mjs doctor --json
printf '%s' 'Review the current changes and return structured JSON.' \
  | $REVIEWBRIDGE/bin/reviewbridge.mjs review
```

Use `CLAUDE_CODE_BIN=/absolute/path/to/claude` when Claude Code is not on PATH.
The launcher also supports `--prompt-file`, `--schema`, and `--max-turns`.

## 中文说明

ReviewBridge 是独立的 Codex 插件入口，用于调用本机 Claude Code 执行第二模型代码审核。
审核提示词可以通过 stdin 或文件传入，结果以 Claude Code 的 JSON 输出返回。

插件是显式调用工具，不会自动阻断 Codex 的修改或交付。
