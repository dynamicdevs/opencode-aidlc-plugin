---
description: Run the Construction phase (per-unit design + code generation)
subtask: true
---
Execute the CONSTRUCTION PHASE, following `.aidlc/aidlc-rules/aws-aidlc-rules/core-workflow.md`. Walk the per-unit
loop (Functional/NFR/Infra Design as applicable -> Code Generation) for the
approved units. Application code goes in the workspace root, NEVER in
`aidlc-docs/`. Use the 2-option completion messages, honor approval gates, and
update checkboxes + audit.md in the SAME interaction.

Target unit (optional): $ARGUMENTS
