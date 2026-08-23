#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { accessSync, constants, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "0.1.0";
const MAX_SEARCH_DEPTH = 4;

function usage() {
  process.stdout.write(
    `ReviewBridge Claude Code launcher v${VERSION}\n\nUsage:\n  reviewbridge doctor [--json]\n  reviewbridge claude [--prompt-file <file>] [--schema <file>] [--max-turns <n>]\n  reviewbridge review [--prompt-file <file>] [--schema <file>] [--max-turns <n>]\n\nInput is read from --prompt-file or stdin.\n`,
  );
}

function isExecutable(file) {
  try {
    if (!statSync(file).isFile()) return false;
    if (platform() !== "win32") accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function candidateRoots() {
  const home = homedir();
  return [
    join(home, ".local", "bin"),
    join(home, ".claude", "local"),
    join(home, ".npm-global", "bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
  ];
}

function boundedSearch(root, depth = 0) {
  if (depth > MAX_SEARCH_DEPTH) return [];
  const result = [];
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isFile() && entry.name === "claude") result.push(path);
    if (entry.isDirectory() && !entry.name.startsWith("."))
      result.push(...boundedSearch(path, depth + 1));
  }
  return result;
}

function resolveClaude() {
  const explicit = process.env.CLAUDE_CODE_BIN;
  if (explicit && isExecutable(explicit))
    return { path: resolve(explicit), source: "CLAUDE_CODE_BIN" };
  const command = platform() === "win32" ? "where.exe" : "which";
  try {
    const found = execFileSync(command, ["claude"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find((value) => value && isExecutable(value));
    if (found) return { path: resolve(found), source: "PATH" };
  } catch {
    // Continue with bounded local discovery.
  }
  for (const root of candidateRoots()) {
    for (const candidate of [join(root, "claude"), ...boundedSearch(root)]) {
      if (isExecutable(candidate)) return { path: candidate, source: root };
    }
  }
  return null;
}

function parseInvocationOptions(args) {
  const parsed = { promptFile: undefined, schema: undefined, maxTurns: "4" };
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (name === "--prompt-file") parsed.promptFile = args[++index];
    else if (name === "--schema") parsed.schema = args[++index];
    else if (name === "--max-turns") parsed.maxTurns = args[++index];
    else throw new Error(`unknown option: ${name}`);
    if (!args[index] || args[index].startsWith("--")) throw new Error(`${name} requires a value`);
  }
  if (!/^\d+$/.test(parsed.maxTurns) || Number(parsed.maxTurns) < 1)
    throw new Error("--max-turns must be a positive integer");
  if (parsed.schema) {
    try {
      if (!statSync(resolve(parsed.schema)).isFile()) throw new Error();
    } catch {
      throw new Error(`--schema file not found: ${parsed.schema}`);
    }
  }
  return parsed;
}

function readPrompt(promptFile) {
  return promptFile ? readFileSync(resolve(promptFile), "utf8") : readFileSync(0, "utf8");
}

function doctor(json, args) {
  if (args.some((arg) => arg !== "--json"))
    throw new Error(`unknown doctor option: ${args.find((arg) => arg !== "--json")}`);
  const claude = resolveClaude();
  const result = {
    ok: claude !== null,
    node: process.version,
    claude: claude?.path ?? null,
    source: claude?.source ?? null,
    pluginRoot: ROOT,
    message: claude
      ? "Claude Code executable found"
      : "Claude Code executable not found; install it or set CLAUDE_CODE_BIN",
  };
  process.stdout.write(
    `${json ? JSON.stringify(result) : `${result.ok ? "OK" : "BLOCKED"}: ${result.message}\n${result.claude ?? ""}`}\n`,
  );
  process.exitCode = result.ok ? 0 : 2;
}

async function invokeClaude(args) {
  const { promptFile, schema, maxTurns } = parseInvocationOptions(args);
  const claude = resolveClaude();
  if (!claude) {
    process.stderr.write(
      "ReviewBridge: Claude Code not found. Run `reviewbridge doctor` or set CLAUDE_CODE_BIN.\n",
    );
    process.exitCode = 2;
    return;
  }
  const prompt = readPrompt(promptFile);
  const claudeArgs = [
    "--print",
    "--output-format",
    "json",
    "--max-turns",
    maxTurns,
    "--no-session-persistence",
    "--disable-slash-commands",
  ];
  if (schema) claudeArgs.push("--json-schema", resolve(schema));
  const child = spawn(claude.path, claudeArgs, { stdio: ["pipe", "inherit", "inherit"] });
  let spawnError = false;
  child.once("error", (error) => {
    spawnError = true;
    process.stderr.write(`ReviewBridge: failed to start Claude Code: ${error.message}\n`);
  });
  child.stdin.end(prompt);
  await new Promise((resolvePromise) =>
    child.once("close", (code, signal) => {
      process.exitCode = typeof code === "number" ? code : signal || spawnError ? 1 : 0;
      resolvePromise();
    }),
  );
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (
    !command ||
    command === "--help" ||
    command === "-h" ||
    command === "--version" ||
    command === "-V"
  ) {
    if (command === "--version" || command === "-V") process.stdout.write(`${VERSION}\n`);
    else usage();
  } else if (command === "version") process.stdout.write(`${VERSION}\n`);
  else if (command === "doctor") doctor(args.includes("--json"), args);
  else if (command === "claude" || command === "review") {
    if (args.includes("--help") || args.includes("-h")) usage();
    else await invokeClaude(args);
  } else {
    usage();
    process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(`ReviewBridge: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
