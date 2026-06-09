#!/usr/bin/env node
"use strict";

/**
 * vendor-rules.js  (maintainer tool)
 *
 * Downloads the pinned awslabs AI-DLC rules release and extracts the rule
 * directories into `rules/`, the offline fallback bundled in the npm package.
 * Re-run after bumping PINNED_VERSION in src/rules.js to refresh the bundle.
 *
 * Usage:
 *   node scripts/vendor-rules.js                # use PINNED_VERSION
 *   node scripts/vendor-rules.js v0.1.8         # explicit version tag
 */

const fs = require("fs");
const path = require("path");

const {
  PINNED_VERSION,
  rulesAssetUrl,
  downloadBuffer,
  extractRuleDirs,
} = require("../src/rules");

const rulesDir = path.join(__dirname, "..", "rules");

async function main() {
  const version = process.argv[2] || PINNED_VERSION;
  const url = rulesAssetUrl(version);
  console.log(`Downloading ${url}`);

  const buf = await downloadBuffer(url);
  fs.rmSync(rulesDir, { recursive: true, force: true });
  fs.mkdirSync(rulesDir, { recursive: true });
  const written = extractRuleDirs(buf, rulesDir);

  console.log(`Done. Vendored ${written} rule files (${version}) -> ${rulesDir}`);
}

main().catch((err) => {
  console.error(`vendor-rules failed: ${err.message}`);
  process.exit(1);
});
