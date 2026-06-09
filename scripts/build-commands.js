#!/usr/bin/env node
"use strict";

/**
 * build-commands.js
 *
 * Pre-renders the AI-DLC command definitions from `src/commands.js` into
 * `commands/*.md`, the files shipped inside the npm package. `bin/setup.js`
 * later copies these into the user's OpenCode commands directory.
 *
 * Usage: node scripts/build-commands.js
 */

const fs = require("fs");
const path = require("path");

const { commands, render } = require("../src/commands");

const outDir = path.join(__dirname, "..", "commands");

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  let written = 0;
  for (const cmd of commands) {
    const file = path.join(outDir, `${cmd.name}.md`);
    fs.writeFileSync(file, render(cmd), "utf8");
    console.log(`render  ${cmd.name}.md`);
    written++;
  }

  console.log(`\nDone. ${written} command files -> ${outDir}`);
}

main();
