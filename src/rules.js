"use strict";

/**
 * Helpers for obtaining the awslabs AI-DLC rule bundle (aidlc-workflows).
 *
 * The bundle ships two top-level directories that the AI-DLC commands expect
 * under `.aidlc/aidlc-rules/`:
 *   - aws-aidlc-rules/         (core workflow)
 *   - aws-aidlc-rule-details/  (conditionally referenced detail rules)
 *
 * Upstream is MIT-0 licensed, so the bundle may be redistributed. See NOTICE.
 *
 * @see https://github.com/awslabs/aidlc-workflows
 */

const fs = require("fs");
const path = require("path");

const { unzipSync } = require("fflate");

const REPO = "awslabs/aidlc-workflows";
// Version vendored into the package as the offline fallback. Bump together with
// the contents of `rules/` via `node scripts/vendor-rules.js`.
const PINNED_VERSION = "v0.1.8";

const RULE_DIRS = ["aws-aidlc-rules/", "aws-aidlc-rule-details/"];

/** Download a URL into a Buffer. Throws on non-2xx or network failure. */
async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "opencode-aidlc-setup" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Build the release-asset URL for a given rules version tag (e.g. "v0.1.8"). */
function rulesAssetUrl(version) {
  return `https://github.com/${REPO}/releases/download/${version}/ai-dlc-rules-${version}.zip`;
}

/** Resolve the latest release and return { version, url } for the rules asset. */
async function getLatestRulesAsset() {
  const buf = await downloadBuffer(
    `https://api.github.com/repos/${REPO}/releases/latest`
  );
  const release = JSON.parse(buf.toString("utf8"));
  const asset = (release.assets || []).find((a) =>
    /^ai-dlc-rules-v.*\.zip$/.test(a.name)
  );
  if (!asset) throw new Error("No ai-dlc-rules asset on latest release");
  return { version: release.tag_name, url: asset.browser_download_url };
}

/**
 * Extract the two rule directories from a release-zip buffer into `destDir`.
 * Tolerates an optional wrapper directory inside the archive. Returns the
 * number of files written.
 */
function extractRuleDirs(zipBuffer, destDir) {
  const entries = unzipSync(new Uint8Array(zipBuffer));
  let written = 0;
  for (const [name, data] of Object.entries(entries)) {
    if (name.endsWith("/") || data.length === 0) continue; // directory entry
    const marker = RULE_DIRS.find((d) => name.includes(d));
    if (!marker) continue;
    const rel = name.slice(name.indexOf(marker)); // strip optional wrapper dir
    const out = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(data));
    written++;
  }
  if (written === 0) throw new Error("No rule files found inside the archive");
  return written;
}

/** Recursively copy a directory tree (Node 16.7+ via fs.cpSync). */
function copyDir(srcDir, destDir) {
  fs.cpSync(srcDir, destDir, { recursive: true });
}

module.exports = {
  REPO,
  PINNED_VERSION,
  RULE_DIRS,
  downloadBuffer,
  rulesAssetUrl,
  getLatestRulesAsset,
  extractRuleDirs,
  copyDir,
};
