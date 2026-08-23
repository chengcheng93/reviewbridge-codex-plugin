#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, lstatSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(skillRoot, "../..");
const launcher = join(pluginRoot, "bin", "reviewbridge.mjs");
if (!existsSync(launcher) || !lstatSync(launcher).isFile())
  throw new Error(`ReviewBridge launcher missing: ${launcher}`);
const child = spawn(process.execPath, [launcher, ...process.argv.slice(2)], { stdio: "inherit" });
child.once("close", (code, signal) => {
  process.exitCode = typeof code === "number" ? code : signal ? 1 : 0;
});
