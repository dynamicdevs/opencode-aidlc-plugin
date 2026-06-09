"use strict";

/**
 * AI-DLC command definitions for OpenCode.
 *
 * Each command: { name, description, frontmatter (extra YAML lines), body }.
 * `frontmatter` holds extra YAML keys beyond `description` (e.g. subtask).
 *
 * These commands wrap the awslabs AI-DLC rules (aidlc-workflows) and assume the
 * rule bundle lives at `.aidlc/aidlc-rules/aws-aidlc-rules/core-workflow.md`,
 * with rule details auto-resolving to `.aidlc/aidlc-rules/aws-aidlc-rule-details/`.
 */

const CORE = "`.aidlc/aidlc-rules/aws-aidlc-rules/core-workflow.md`";

const commands = [
  {
    name: "aidlc",
    description: "Start the AI-DLC workflow on a new intent",
    body: `Treat this as a "Using AI-DLC, ..." message. Read and follow
${CORE} (rule details resolve to \`.aidlc/aidlc-rules/aws-aidlc-rule-details/\`).

Run Workspace Detection first, honor ALL approval gates, and log every
interaction in \`aidlc-docs/audit.md\`.

Intent: $ARGUMENTS`,
  },
  {
    name: "aidlc-analyze",
    description: "Reverse-engineer an existing codebase (brownfield)",
    body: `Start AI-DLC in brownfield mode on this repository, following
${CORE}. Execute the Reverse Engineering stage: architecture, component
inventory, APIs, interaction diagrams, tech stack, and dependencies. Wait for
explicit approval before proceeding and log to \`aidlc-docs/audit.md\`.

Optional scope: $ARGUMENTS`,
  },
  {
    name: "aidlc-plan",
    description: "Generate or refresh the AI-DLC execution plan for approval",
    body: `Execute the Workflow Planning stage, following ${CORE}. Load prior
context from \`aidlc-docs/\`, decide which stages to run and at what depth, and
present the plan (with validated Mermaid) for my approval. Do not proceed
without confirmation.`,
  },
  {
    name: "aidlc-build",
    description:
      "Run the Construction phase (per-unit design + code generation)",
    frontmatter: ["subtask: true"],
    body: `Execute the CONSTRUCTION PHASE, following ${CORE}. Walk the per-unit
loop (Functional/NFR/Infra Design as applicable -> Code Generation) for the
approved units. Application code goes in the workspace root, NEVER in
\`aidlc-docs/\`. Use the 2-option completion messages, honor approval gates, and
update checkboxes + audit.md in the SAME interaction.

Target unit (optional): $ARGUMENTS`,
  },
  {
    name: "aidlc-test",
    description: "Generate and run build & test (final Construction stage)",
    body: `Execute the Build and Test stage, following ${CORE}. Generate the
instruction files under \`aidlc-docs/construction/build-and-test/\` and run the
suites.

Repo state:
!\`git status --porcelain; echo '---'; ls\``,
  },
  {
    name: "aidlc-status",
    description: "AI-DLC workflow status (read-only, makes no changes)",
    body: `Do NOT modify anything. Report: current phase and stage, last
completed step, next step, and which stages ran or were skipped, based on:
@aidlc-docs/aidlc-state.md`,
  },
  {
    name: "aidlc-resume",
    description: "Resume an in-progress AI-DLC project",
    body: `Resume the workflow. Apply the rules in
\`.aidlc/aidlc-rules/aws-aidlc-rule-details/common/session-continuity.md\`: read
the state, load the artifacts from previous stages, and continue from the next
step honoring approval gates.

Current state:
@aidlc-docs/aidlc-state.md`,
  },
  {
    name: "aidlc-refine",
    description: "Amend intent / units / design without losing state",
    body: `I'm mid-way through the AI-DLC workflow. Apply the following change to
the existing artifacts in \`aidlc-docs/\` (requirements, user-stories, units, or
per-unit design), update \`aidlc-docs/aidlc-state.md\` and any dependent units,
and do NOT restart already-approved stages. Log the change in
\`aidlc-docs/audit.md\`.

Change: $ARGUMENTS`,
  },
  {
    name: "aidlc-reflect",
    description: "Retrospective of the AI-DLC cycle",
    body: `Do NOT modify code. Analyze the cycle using \`aidlc-docs/audit.md\` and
the artifacts in \`aidlc-docs/\`. Summarize: what was built, key decisions,
friction points, and recommendations for the next intent.`,
  },
];

/** Render a command definition into its OpenCode `.md` file contents. */
function render(cmd) {
  const fm = [`description: ${cmd.description}`, ...(cmd.frontmatter || [])];
  return `---\n${fm.join("\n")}\n---\n${cmd.body}\n`;
}

module.exports = { commands, render };
