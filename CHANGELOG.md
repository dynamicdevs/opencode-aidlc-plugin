# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-10

### Added

- `setup` now supports registering the plugin in either `./opencode.json` or
  `.opencode/opencode.json`. The location is auto-detected: if an existing
  `opencode.json`/`opencode.jsonc` is found in the project root or in `.opencode/`,
  that file is updated; otherwise it defaults to the project root.
- New `--nested` flag to force registration in `.opencode/opencode.json`, and
  `--root` to force the project root (the default).

## [0.1.0] - 2026-06-09

### Added

- Initial release: nine AI-DLC slash commands (`/aidlc`, `/aidlc-analyze`,
  `/aidlc-plan`, `/aidlc-build`, `/aidlc-test`, `/aidlc-status`, `/aidlc-resume`,
  `/aidlc-refine`, `/aidlc-reflect`).
- `setup` command that installs the commands, vendors the awslabs AI-DLC rule
  bundle into `.aidlc/aidlc-rules/`, and registers the plugin in `opencode.json`.
- `--global`, `--force`, and `--no-register` flags for `setup`.

[0.2.0]: https://github.com/dynamicdevs/opencode-aidlc-plugin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dynamicdevs/opencode-aidlc-plugin/releases/tag/v0.1.0
