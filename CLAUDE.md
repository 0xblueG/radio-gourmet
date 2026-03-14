# Radio-gourmet

## What is this?

Radiology workflow tool — split-screen DICOM viewer + structured report editor with native RECIST 1.1 integration. Built for radiologists to replace the PACS → Excel → dictation workflow with a single unified interface.

**MVP scope:** RECIST 1.1 baseline only (no longitudinal follow-up yet). Local DICOM files only (no PACS integration). Template-based auto-completion (no LLM yet).

## Tech Stack

- **Framework:** React 18+ with TypeScript (strict mode)
- **Build:** Vite
- **DICOM Viewer:** Cornerstone3D (@cornerstonejs/core, @cornerstonejs/tools, @cornerstonejs/dicom-image-loader)
- **Report Editor:** TipTap (ProseMirror-based)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Testing:** Vitest + React Testing Library
- **Language:** English everywhere (code, comments, variable names). UI in English.

## Project Structure

```
src/
├── app/                  # App shell, layout, routing
├── components/           # Shared UI components
├── features/
│   ├── viewer/           # DICOM viewer (Cornerstone3D integration)
│   │   ├── components/   # Viewer-specific components
│   │   ├── hooks/        # useCornerstone, useDicomLoader, etc.
│   │   └── utils/        # DICOM parsing helpers
│   ├── measurements/     # Lesion tracking & RECIST logic
│   │   ├── components/   # Lesion list, annotation overlays
│   │   ├── hooks/        # useMeasurements, useRecist
│   │   ├── store.ts      # Zustand store for measurements
│   │   ├── recist.ts     # RECIST 1.1 rules engine (pure functions)
│   │   └── recist.test.ts
│   └── report/           # Report editor
│       ├── components/   # TipTap editor, template picker
│       ├── hooks/        # useReport, useTemplates
│       ├── templates/    # JSON template definitions
│       └── store.ts      # Zustand store for report state
├── stores/               # Global stores (if any cross-feature state)
├── types/                # Shared TypeScript types
└── utils/                # Shared utilities
```

## Architecture Principles

- **Feature-based organization:** Each feature is self-contained with its own components, hooks, store, and tests.
- **Pure RECIST logic:** All RECIST 1.1 rules live in pure functions (`recist.ts`) with no UI dependencies. 100% unit test coverage required on this file.
- **Unidirectional data flow:** Viewer → Measurements Store → Report. The viewer produces measurements, the store validates them against RECIST rules, the report reads from the store.
- **No premature abstraction:** Don't create helpers/utilities until there are 3+ concrete use cases.

## RECIST 1.1 Baseline Rules (domain knowledge)

These rules MUST be enforced in the measurements module:

- **Target lesions:** max 5 total, max 2 per organ
- **Measurability:** target lesion ≥ 10mm longest diameter; lymph nodes ≥ 15mm short axis
- **Sum of Longest Diameters (SLD):** sum of the longest diameter of all target lesions — this is the baseline reference value
- **Non-target lesions:** tracked as present, not measured (just noted)
- **Lesion types:** target, non-target, new lesion (new = not applicable at baseline)

Key vocabulary:
- SLD = Sum of Longest Diameters
- CR = Complete Response, PR = Partial Response, SD = Stable Disease, PD = Progressive Disease
- These response categories are NOT used at baseline — they require a follow-up comparison

## UX Constraints

- Every interaction must be faster than the current workflow (measure in PACS → copy to Excel → dictate report)
- Keyboard shortcuts are mandatory for common actions (next/prev slice, place measurement, switch tool)
- Minimize clicks: one-click lesion type assignment after measurement
- The viewer must remain responsive with large series (500+ slices)

## What we do NOT build in MVP

- PACS integration (DIMSE, DICOMweb)
- Follow-up visits / longitudinal tracking
- LLM-assisted report generation
- User authentication
- Multi-user / collaborative editing
- DICOM SR (Structured Report) export

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run tests (Vitest)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Code Conventions

- Functional components only, no class components
- Custom hooks for any logic reuse (`use` prefix)
- Zustand stores: one per feature, named `store.ts`
- Types: co-locate with feature unless shared across 2+ features → then `src/types/`
- File naming: kebab-case for files, PascalCase for components
- No default exports (except pages if routing requires it)
- Tests: co-located with source files (`foo.test.ts` next to `foo.ts`)

## Living Documentation

- **`ARCHITECTURE.md`** at project root is the living architecture document. It documents the current architecture, technical choices (with rationale), data models, and data flow.
- **Rule:** When you make a significant architectural change (new module, new dependency, data flow change, new pattern), you MUST update `ARCHITECTURE.md` in the same changeset.
- ARCHITECTURE.md is for humans (contributors, future you). CLAUDE.md is for Claude.
