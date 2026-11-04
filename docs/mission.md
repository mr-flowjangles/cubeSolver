# Cube Solver — Mission Statement

## Mission

<!-- One paragraph: what problem the tool solves, for whom, and how. Lead with the user need, not the implementation. -->

## Who this is for

<!-- Describe the target user / customer. Concrete attributes (size, role, technical capability, regulatory pressure, ...). The hardest constraint here often shapes the entire design. -->

## What the tool must do

<!-- Numbered list of behaviors that define success. Outcomes, not implementation details. -->

1. ...

## Hard constraints

<!-- Non-negotiable inputs to the design (compliance, deployment posture, performance budget, ...). -->

- ...

## Decisions EHA has already made

<!-- Anything locked before design starts: language, cloud, framework, etc. These are inputs to the design, not open questions. -->

- ...

## Scope explicitly *out* of v1

<!-- What this version deliberately does NOT do. Helps prevent scope creep. -->

- ...

## Working style at EHA

The team aligns on design before writing code. Decisions are recorded in version-controlled `docs/`. Deferred decisions are tracked explicitly with their resolution triggers. Unanticipated questions surfaced during implementation pause the work until the docs catch up — no silent decisions in code.

Versions follow three-part semver, one PR per version. Release notes are cumulative under `Versions/v{major}/v{major}.{minor}.{patch}/`.

---

## What this brief deliberately does NOT prescribe

<!--
List the design choices that should remain open for the design exercise itself to resolve.
Keeping these unspecified prevents premature decisions.
-->

To keep the design space open for fresh evaluation:

- ...

A complete design needs to make calls on all of the above, but those calls are *outputs* of the design exercise, not constraints on it.
