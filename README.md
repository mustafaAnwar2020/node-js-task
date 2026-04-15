# AI-Based Design Replication Engine (MVP)

This project is a Node.js/TypeScript MVP that:

1. Takes a storefront URL.
2. Captures visual + structural page data via Playwright.
3. Extracts design tokens (colors, typography, spacing, radius).
4. Detects page sections (hero, product grid, header, footer, etc.).
5. Maps detected sections into an internal component registry.

## Full Project Workflow

### 1) High-Level Architecture

```mermaid
flowchart LR
    U[User / Analyst] --> C[CLI or Web UI]
    C --> O[Orchestrator Pipeline]
    O --> P[Playwright Capture]
    P --> T[Token Extractor]
    T --> S[Section Classifier]
    S --> M[Component Mapper]
    M --> A[Artifacts Writer]
    A --> F[outputs/<timestamp>/]
```

### 2) End-to-End Processing Flow

```mermaid
flowchart TD
    A[Input: URL + pageType + viewport] --> B[Validate inputs]
    B --> C[Launch browser with Playwright]
    C --> D[Capture page screenshot + DOM/CSS metadata]
    D --> E[Build capture.json]
    E --> F[Extract design tokens]
    F --> G[Build tokens.json]
    G --> H[Classify page sections]
    H --> I[Build sections.json]
    I --> J[Map sections to component registry]
    J --> K[Build mapping.json]
    K --> L[Assemble full theme payload]
    L --> M[Build theme-payload.json]
    M --> N[Write all artifacts to outputs/<timestamp>/]
```

### 3) Runtime Sequence (Web/CLI to Artifacts)

```mermaid
sequenceDiagram
    participant User
    participant Interface as CLI/Web UI
    participant Pipeline
    participant Browser as Playwright
    participant FS as File System

    User->>Interface: Submit URL + options
    Interface->>Pipeline: Start run
    Pipeline->>Browser: Open page and capture data
    Browser-->>Pipeline: Screenshot + structural data
    Pipeline->>Pipeline: Extract tokens
    Pipeline->>Pipeline: Classify sections
    Pipeline->>Pipeline: Map components
    Pipeline->>FS: Write JSON artifacts + screenshot
    FS-->>Interface: Output paths + run stats
    Interface-->>User: Display links + raw JSON
```

## Run

```bash
npm install
npm run dev -- --url https://example-store.com --pageType home --viewport desktop
```

Arguments:
- `--url` (required): storefront URL
- `--pageType` (optional): `home` | `collection` | `product`
- `--viewport` (optional): `desktop` | `mobile`

Workflow for CLI mode:

```mermaid
flowchart LR
    A[npm run dev -- --url ...] --> B[Pipeline execution]
    B --> C[Generate artifacts]
    C --> D[Inspect outputs/<timestamp>/]
```

## Web UI

Run the local web interface:

```bash
npm run web
```

Then open `http://localhost:3000`.

Use the form to submit a URL. The server runs the pipeline and returns:
- run stats
- links to generated artifacts
- raw JSON response

Workflow for Web UI mode:

```mermaid
flowchart LR
    A[Open localhost:3000] --> B[Submit form]
    B --> C[Backend pipeline run]
    C --> D[Artifacts + response payload]
    D --> E[UI shows stats and links]
```

## Output

Each run creates a folder under `outputs/<timestamp>/` with:

- `capture.json`: raw capture bundle
- `tokens.json`: extracted design tokens
- `sections.json`: section classification output
- `mapping.json`: mapping-only output
- `theme-payload.json`: full payload ready for import/review
- Screenshot file used as visual reference

Artifact dependency chart:

```mermaid
flowchart TD
    A[capture.json] --> B[tokens.json]
    A --> C[sections.json]
    B --> D[mapping.json]
    C --> D
    B --> E[theme-payload.json]
    C --> E
    D --> E
```

## Notes

- This MVP is deterministic and rule-based for extraction/classification.
- AI can later be layered in for ambiguous section classification and smarter mapping decisions.
