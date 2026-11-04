# 01 — Architecture

## The spine

<!--
One short paragraph: the system's organizing principle.
For the FHIR tool the spine is "two phases with a contract artifact between them" — Discovery (LLM, once) → mapping.yaml → Extraction (deterministic, every run).
Find your equivalent. The spine should fit on one line and a diagram.
-->

```
... ──▶ {contract artifact} ──▶ ...
```

## Why this shape

<!--
Bullet list of reasons. Common axes:
- Cost & speed
- Auditability
- Determinism / reproducibility
- Failure isolation
- Fit-for-constraints (regulatory, deployment, headcount, ...)
-->

- ...

## Modules / phases

<!-- One subsection per major module or phase. Each describes inputs, outputs, what it owns, what it doesn't. -->

### Module 1 — ...

### Module 2 — ...

## The contract artifact

<!--
Identify the one canonical intermediate representation that every module produces or consumes.
This is the most important section of this doc — it's the seam that defines the system.
For the FHIR tool: `mapping.yaml`. For an LLM-powered analyzer: a typed `AnalysisResult`. For a renderer: the `RenderedX` shape.
-->

```ts
// Example shape; adapt to your project's language.
type Artifact = {
  ...
};
```

Schema spec: see `02-{contract-spec}.md` (create when contract details exceed what fits here).

## File / process layout

```
cubesolver/
├── CLAUDE.md
├── docs/
├── src/
│   └── ...
├── tests/
├── infra/terraform/
└── Dockerfile
```

## Subsystem responsibilities

| Subsystem | Owns | Talks to |
| --------- | ---- | -------- |
| `...`     | ...  | ...      |

## Non-goals for the architecture

<!-- What the architecture deliberately does NOT support. -->

- ...
