#!/usr/bin/env node
"use strict";

/**
 * opencode-aidlc setup
 *
 * Installs the AI-DLC integration into a project (or globally):
 *   1. Copies the AI-DLC slash commands into the OpenCode commands directory.
 *      (OpenCode does NOT auto-discover commands from npm packages, so they must
 *       be copied locally.)
 *   2. Installs the awslabs AI-DLC rule bundle into `.aidlc/aidlc-rules/`, but
 *      ONLY if it does not already exist. Tries the latest GitHub release first,
 *      and falls back to the copy vendored in this package when offline.
 *   3. Registers this package in `opencode.json`'s `plugin` array (best effort).
 *      The config is auto-detected: if an `opencode.json`/`opencode.jsonc` already
 *      exists in the project root or in `.opencode/`, that file is updated;
 *      otherwise it defaults to the project root. Force a location with
 *      `--root` / `--nested`.
 *
 * Usage:
 *   npx opencode-aidlc setup            # project: .opencode/commands + ./.aidlc
 *   npx opencode-aidlc setup --global   # commands in ~/.config/opencode
 *   npx opencode-aidlc setup --force    # overwrite existing command files
 *   npx opencode-aidlc setup --nested   # register in .opencode/opencode.json
 *   npx opencode-aidlc setup --root     # register in ./opencode.json (default)
 *   npx opencode-aidlc setup --no-register   # don't touch opencode.json
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  getLatestRulesAsset,
  downloadBuffer,
  extractRuleDirs,
  copyDir,
  PINNED_VERSION,
} = require("../src/rules");

const PKG_NAME = "opencode-aidlc";
const PKG_ROOT = path.join(__dirname, "..");

// --- CLI args ----------------------------------------------------------------
function parseArgs(argv) {
  const opts = { global: false, force: false, register: true, configLocation: "auto" };
  for (const a of argv) {
    if (a === "--global") opts.global = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--no-register") opts.register = false;
    else if (a === "--nested") opts.configLocation = "nested";
    else if (a === "--root") opts.configLocation = "root";
    else if (a === "setup") continue; // tolerate `opencode-aidlc setup`
    else if (a === "-h" || a === "--help") opts.help = true;
    else console.warn(`warn    unknown argument: ${a}`);
  }
  return opts;
}

function printHelp() {
  console.log(
    [
      "opencode-aidlc setup [--global] [--force] [--nested|--root] [--no-register]",
      "",
      "  --global       install commands in ~/.config/opencode/commands",
      "  --force        overwrite existing command files",
      "  --nested       register the plugin in .opencode/opencode.json",
      "  --root         register the plugin in ./opencode.json (default)",
      "  --no-register  do not add the plugin to opencode.json",
    ].join("\n")
  );
}

// --- Step 1: commands --------------------------------------------------------
function installCommands(destDir, force) {
  const srcDir = path.join(PKG_ROOT, "commands");
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".md"));
  fs.mkdirSync(destDir, { recursive: true });

  let created = 0;
  let skipped = 0;
  for (const file of files) {
    const dest = path.join(destDir, file);
    if (fs.existsSync(dest) && !force) {
      console.log(`skip    /${file.replace(/\.md$/, "")}  (exists, use --force)`);
      skipped++;
      continue;
    }
    const exists = fs.existsSync(dest);
    fs.copyFileSync(path.join(srcDir, file), dest);
    console.log(`${exists ? "update" : "create"}  /${file.replace(/\.md$/, "")}`);
    created++;
  }
  console.log(`\nCommands: ${created} written, ${skipped} skipped -> ${destDir}`);
}

// --- Step 2: rules -----------------------------------------------------------
async function installRules(rulesDest) {
  if (fs.existsSync(rulesDest)) {
    console.log(`\nRules: ${rulesDest} already exists -> skipped (not modified).`);
    return;
  }

  try {
    const { version, url } = await getLatestRulesAsset();
    const buf = await downloadBuffer(url);
    const written = extractRuleDirs(buf, rulesDest);
    console.log(`\nRules: downloaded ${version} (${written} files) -> ${rulesDest}`);
  } catch (err) {
    const vendored = path.join(PKG_ROOT, "rules");
    if (!fs.existsSync(vendored)) {
      console.error(
        `\nRules: download failed (${err.message}) and no vendored bundle found.`
      );
      console.error(
        "       Run `node scripts/vendor-rules.js` before publishing the package."
      );
      return;
    }
    copyDir(vendored, rulesDest);
    console.log(
      `\nRules: download failed (${err.message}); used vendored ${PINNED_VERSION} -> ${rulesDest}`
    );
  }
}

// --- Step 3: register plugin -------------------------------------------------
function hasConfig(dir) {
  return (
    fs.existsSync(path.join(dir, "opencode.json")) ||
    fs.existsSync(path.join(dir, "opencode.jsonc"))
  );
}

// Decide where the project-level opencode config lives. An explicit --root or
// --nested wins; otherwise auto-detect an existing config (root takes priority
// if both exist) and fall back to the project root for a fresh project.
function resolveProjectConfigDir(cwd, location) {
  const root = cwd;
  const nested = path.join(cwd, ".opencode");
  if (location === "nested") return nested;
  if (location === "root") return root;
  if (hasConfig(root)) return root;
  if (hasConfig(nested)) return nested;
  return root;
}

function registerPlugin(configDir) {
  fs.mkdirSync(configDir, { recursive: true });
  const jsonPath = path.join(configDir, "opencode.json");
  const jsoncPath = path.join(configDir, "opencode.jsonc");

  if (fs.existsSync(jsoncPath) && !fs.existsSync(jsonPath)) {
    console.log(
      `\nPlugin: found opencode.jsonc — add "${PKG_NAME}" to its "plugin" array manually.`
    );
    return;
  }

  let config = { $schema: "https://opencode.ai/config.json" };
  if (fs.existsSync(jsonPath)) {
    try {
      config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (err) {
      console.log(
        `\nPlugin: could not parse opencode.json (${err.message}). ` +
          `Add "${PKG_NAME}" to its "plugin" array manually.`
      );
      return;
    }
  }

  const plugins = Array.isArray(config.plugin) ? config.plugin : [];
  if (plugins.includes(PKG_NAME)) {
    console.log(`\nPlugin: "${PKG_NAME}" already in ${jsonPath}.`);
    return;
  }
  plugins.push(PKG_NAME);
  config.plugin = plugins;
  fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`\nPlugin: registered "${PKG_NAME}" in ${jsonPath}.`);
}

// --- Main --------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return printHelp();

  const commandsDest = opts.global
    ? path.join(os.homedir(), ".config", "opencode", "commands")
    : path.join(process.cwd(), ".opencode", "commands");
  // Rules are always project-scoped: they live beside aidlc-docs/ in the repo.
  const rulesDest = path.join(process.cwd(), ".aidlc", "aidlc-rules");
  const configDir = opts.global
    ? path.join(os.homedir(), ".config", "opencode")
    : resolveProjectConfigDir(process.cwd(), opts.configLocation);

  installCommands(commandsDest, opts.force);
  await installRules(rulesDest);
  if (opts.register) registerPlugin(configDir);

  console.log(
    "\nDone. In OpenCode run /aidlc, /aidlc-plan, /aidlc-build, /aidlc-status, ..."
  );
}

main().catch((err) => {
  console.error(`setup failed: ${err.stack || err.message}`);
  process.exit(1);
});
