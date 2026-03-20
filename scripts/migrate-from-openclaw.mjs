#!/usr/bin/env node

import fs from "node:fs/promises";
import fssync from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const sourceRoot = path.join(home, ".openclaw");
const targetRoot = path.join(home, ".trident");
const sourceConfig = path.join(sourceRoot, "openclaw.json");
const targetConfig = path.join(targetRoot, "trident.json");

const TEXT_EXTENSIONS = new Set([
  ".json",
  ".jsonl",
  ".md",
  ".txt",
  ".sh",
  ".py",
  ".mjs",
  ".js",
  ".yaml",
  ".yml",
  ".env",
]);

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyTree(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyTree(srcPath, dstPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      const link = await fs.readlink(srcPath);
      try {
        await fs.symlink(link, dstPath);
      } catch {}
      continue;
    }
    await fs.copyFile(srcPath, dstPath);
    const stat = await fs.stat(srcPath);
    await fs.chmod(dstPath, stat.mode);
  }
}

function shouldRewriteText(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function rewriteText(content) {
  return content
    .replaceAll("/home/graham/.openclaw", "/home/graham/.trident")
    .replaceAll("~/.openclaw", "~/.trident")
    .replaceAll(".openclaw/workspaces", ".trident/workspaces")
    .replaceAll(".openclaw/agents", ".trident/agents")
    .replaceAll(".openclaw/tools", ".trident/tools")
    .replaceAll(".openclaw/credentials", ".trident/credentials")
    .replaceAll("openclaw.json", "trident.json");
}

async function rewriteJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await fs.writeFile(filePath, rewriteText(raw), "utf8");
    return;
  }
  const walked = JSON.parse(JSON.stringify(parsed), (_key, value) => {
    if (typeof value !== "string") return value;
    return rewriteText(value);
  });
  await fs.writeFile(filePath, JSON.stringify(walked, null, 2) + "\n", "utf8");
}

async function rewriteFiles(root) {
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (!shouldRewriteText(entryPath)) continue;
      if (entry.name.endsWith(".json") || entry.name.endsWith(".jsonl")) {
        await rewriteJsonFile(entryPath);
        continue;
      }
      const raw = await fs.readFile(entryPath, "utf8");
      const next = rewriteText(raw);
      if (next !== raw) await fs.writeFile(entryPath, next, "utf8");
    }
  }
}

async function migrateConfig() {
  if (!await exists(sourceConfig)) return false;
  await fs.copyFile(sourceConfig, targetConfig);
  await rewriteJsonFile(targetConfig);
  return true;
}

async function main() {
  if (!fssync.existsSync(sourceRoot)) {
    console.error(`trident migrate-from-openclaw: source state not found at ${sourceRoot}`);
    process.exit(1);
  }

  await fs.mkdir(targetRoot, { recursive: true });
  await copyTree(sourceRoot, targetRoot);

  if (await exists(path.join(targetRoot, "openclaw.json"))) {
    await fs.rename(path.join(targetRoot, "openclaw.json"), targetConfig);
  }

  await rewriteFiles(targetRoot);
  await migrateConfig();

  console.log(`Migrated OpenClaw state from ${sourceRoot} to ${targetRoot}`);
  console.log(`Primary config: ${targetConfig}`);
}

await main();
