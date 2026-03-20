#!/usr/bin/env node

import module from "node:module";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 12;
const MIN_NODE_VERSION = `${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}`;

const parseNodeVersion = (rawVersion) => {
  const [majorRaw = "0", minorRaw = "0"] = rawVersion.split(".");
  return {
    major: Number(majorRaw),
    minor: Number(minorRaw),
  };
};

const isSupportedNodeVersion = (version) =>
  version.major > MIN_NODE_MAJOR ||
  (version.major === MIN_NODE_MAJOR && version.minor >= MIN_NODE_MINOR);

const ensureSupportedNodeVersion = () => {
  if (isSupportedNodeVersion(parseNodeVersion(process.versions.node))) {
    return;
  }

  process.stderr.write(
    `trident: Node.js v${MIN_NODE_VERSION}+ is required (current: v${process.versions.node}).\n` +
      "If you use nvm, run:\n" +
      `  nvm install ${MIN_NODE_MAJOR}\n` +
      `  nvm use ${MIN_NODE_MAJOR}\n` +
      `  nvm alias default ${MIN_NODE_MAJOR}\n`,
  );
  process.exit(1);
};

ensureSupportedNodeVersion();

const launcherDir = path.dirname(fileURLToPath(import.meta.url));
const tridentStateDir = process.env.TRIDENT_STATE_DIR?.trim() || path.join(os.homedir(), ".trident");
const tridentConfigPath = process.env.TRIDENT_CONFIG_PATH?.trim() || path.join(tridentStateDir, "trident.json");

process.env.TRIDENT_STATE_DIR = tridentStateDir;
process.env.TRIDENT_CONFIG_PATH = tridentConfigPath;
if (!process.env.OPENCLAW_STATE_DIR?.trim()) process.env.OPENCLAW_STATE_DIR = tridentStateDir;
if (!process.env.OPENCLAW_CONFIG_PATH?.trim()) process.env.OPENCLAW_CONFIG_PATH = tridentConfigPath;

const subcommand = process.argv[2]?.trim();
if (subcommand === "migrate-from-openclaw" || (subcommand === "import" && process.argv[3]?.trim() === "openclaw")) {
  await import(pathToFileURL(path.join(launcherDir, "scripts", "migrate-from-openclaw.mjs")).href);
  process.exit(0);
}
if (subcommand === "update") {
  process.stderr.write("trident: self-update is disabled in this fork. Update the Trident repo/install directly and restart with `trident gateway restart`.\n");
  process.exit(1);
}

// https://nodejs.org/api/module.html#module-compile-cache
if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Ignore errors
  }
}

const isModuleNotFoundError = (err) =>
  err && typeof err === "object" && "code" in err && err.code === "ERR_MODULE_NOT_FOUND";

const installProcessWarningFilter = async () => {
  // Keep bootstrap warnings consistent with the TypeScript runtime.
  for (const specifier of ["./dist/warning-filter.js", "./dist/warning-filter.mjs"]) {
    try {
      const mod = await import(specifier);
      if (typeof mod.installProcessWarningFilter === "function") {
        mod.installProcessWarningFilter();
        return;
      }
    } catch (err) {
      if (isModuleNotFoundError(err)) {
        continue;
      }
      throw err;
    }
  }
};

await installProcessWarningFilter();

const tryImport = async (specifier) => {
  try {
    await import(specifier);
    return true;
  } catch (err) {
    // Only swallow missing-module errors; rethrow real runtime errors.
    if (isModuleNotFoundError(err)) {
      return false;
    }
    throw err;
  }
};

if (await tryImport("./dist/entry.js")) {
  // OK
} else if (await tryImport("./dist/entry.mjs")) {
  // OK
} else {
  throw new Error("trident: missing dist/entry.(m)js (build output).");
}
