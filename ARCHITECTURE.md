# Radio-gourmet — Architecture

> This document is kept up-to-date as the project evolves. Last updated: 2026-03-14 (measurements module added).

## Overview

Radio-gourmet is a single-page web application (React + Vite) with a split-screen layout:

```
┌─────────────────────────────────────────────────┐
│                  App Shell                       │
├────────────────────┬────────────────────────────┤
│                    │                            │
│   DICOM Viewer     │    Report Editor           │
│   (Cornerstone3D)  │    (TipTap)                │
│                    │                            │
│   - Display series │    - Structured templates  │
│   - Measurements   │    - Auto-completion       │
│   - Annotations    │    - RECIST data injection │
│                    │                            │
├────────────────────┴────────────────────────────┤
│           Measurements Store (Zustand)           │
│         RECIST 1.1 Rules Engine (pure fn)        │
└─────────────────────────────────────────────────┘
```

## Data Flow

```
DICOM File (local)
  → Cornerstone3D (parse + render)
  → User places measurement (annotation tool)
  → Measurement event captured by hook
  → Validated against RECIST 1.1 rules (recist.ts)
  → Stored in Measurements Store (Zustand)
  → Report Editor reads from store
  → Template placeholders filled with measurement data
  → Export as PDF
```

## Technical Choices & Rationale

| Choice | Why |
|--------|-----|
| **React + Vite** (not Electron) | Cornerstone3D is 100% web-native. Electron adds ~150MB overhead and WebGL complexity for no MVP benefit. Local DICOM loading works via `<input type="file">` / drag & drop. |
| **Cornerstone3D** (not custom viewer) | Mature, GPU-accelerated DICOM rendering with built-in measurement tools. Avoids months of viewer development. |
| **TipTap** (not Slate/Lexical) | Best plugin ecosystem for structured editing: templates, mentions, auto-completion. ProseMirror under the hood = battle-tested. |
| **Zustand** (not Redux/Jotai) | Minimal API, no boilerplate. One store per feature keeps things simple. Sufficient for this app's state complexity. |
| **Tailwind CSS** | Utility-first, fast iteration, consistent design tokens. No need for a component library at MVP stage. |
| **Pure functions for RECIST** | Medical calculation logic must be testable in isolation. No UI/state dependencies. Enables 100% unit test coverage on critical path. |

## Data Models

### Lesion

Defined in `src/types/measurements.ts`.

```typescript
type Organ = 'liver' | 'lung' | 'lymph_node' | 'bone' | 'brain'
           | 'adrenal' | 'kidney' | 'peritoneum' | 'soft_tissue' | 'other';
type LesionType = 'target' | 'non-target';

interface Lesion {
  id: string;
  type: LesionType;
  organ: Organ;
  longestDiameter: number;    // mm — for target lesions
  shortAxis?: number;         // mm — for lymph nodes
  annotationUID: string;      // links to Cornerstone3D annotation
  seriesInstanceUID: string;  // which DICOM series
  imageId: string;            // which specific image/slice
  label: string;              // auto-generated: "T1", "NT2", etc.
}
```

### RECIST Baseline Summary

```typescript
interface ValidationError {
  rule: string;                     // machine-readable rule id
  message: string;                  // human-readable description
}

interface RecistBaseline {
  targetLesions: Lesion[];          // max 5
  nonTargetLesions: Lesion[];       // unlimited
  sumOfLongestDiameters: number;    // calculated, mm
  isValid: boolean;                 // all RECIST rules satisfied
  validationErrors: ValidationError[];
}
```

### RECIST Rules Engine

Pure functions in `src/features/measurements/recist.ts`. No UI/state/Cornerstone dependencies. 100% unit test coverage.

Validation rules:
- `validateTargetLesionCount` — max 5 target lesions
- `validateTargetLesionsPerOrgan` — max 2 per organ
- `validateMeasurability` — targets ≥ 10mm; lymph nodes ≥ 15mm short axis
- `calculateSLD` — sum of longest diameters (uses short axis for lymph nodes per RECIST 1.1)
- `validateBaseline` — runs all validations, returns `RecistBaseline`

### Measurements Store

Zustand store in `src/features/measurements/store.ts`. Every mutation revalidates the baseline via `validateBaseline`.

Actions: `addLesion`, `removeLesion`, `updateLesion`, `selectLesion`, `clearAll`.

### Annotation Bridge

Hook `useAnnotationEvents` in `src/features/measurements/hooks/` listens to Cornerstone3D `ANNOTATION_COMPLETED`, `ANNOTATION_MODIFIED`, `ANNOTATION_REMOVED` events on `eventTarget` and syncs them with the measurements store.

### Report

```typescript
interface Report {
  id: string;
  templateId: string;
  content: JSONContent;          // TipTap document as JSON
  recistData: RecistBaseline;    // snapshot of RECIST data at report time
  createdAt: Date;
  exportedAt?: Date;
}
```

## Dependencies

| Package | Role |
|---------|------|
| `@cornerstonejs/core` | DICOM rendering engine |
| `@cornerstonejs/tools` | Annotation & measurement tools |
| `@cornerstonejs/dicom-image-loader` | DICOM file parsing & loading |
| `dicom-parser` | Low-level DICOM tag parsing |
| `@tiptap/react` | Rich text editor for reports |
| `@tiptap/starter-kit` | Basic TipTap extensions bundle |
| `zustand` | State management |
| `tailwindcss` | Styling |
