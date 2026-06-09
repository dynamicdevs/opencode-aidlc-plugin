"use strict";

/**
 * opencode-aidlc — OpenCode plugin entry point.
 *
 * The AI-DLC integration is delivered as slash commands (installed into
 * `.opencode/commands/` by `bin/setup.js`) plus the awslabs rule bundle under
 * `.aidlc/aidlc-rules/`. There are no runtime hooks today, so this entry is a
 * no-op: it exists so the package is a legitimate OpenCode plugin that can be
 * listed in `opencode.json`'s `plugin` array (and a place to add hooks later).
 *
 * @see https://opencode.ai/docs/plugins/
 */
const AidlcPlugin = async () => ({});

module.exports = { AidlcPlugin };
