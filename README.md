# RegistrarIQ Transcript Console

A registrar-facing Next.js app that accepts transcript uploads (`.txt`/`.pdf`), parses course lines, supports review confirmation, and computes explainable eligibility.

## Tech stack

- Next.js (App Router) + JavaScript
- API routes for transcript processing
- Vitest for core logic tests

## Project structure

- `app/page.jsx` – main registrar workflow UI
- `app/api/upload-transcript/route.js` – upload processing endpoint (includes PDF text extraction)
- `app/api/health/route.js` – health endpoint
- `app/api/review-course/route.js` – review save endpoint
- `components/ReviewTable.jsx` – match-review queue UI
- `lib/parser.js` – line parser
- `lib/matcher.js` – equivalency matcher with confidence scoring
- `lib/eligibility.js` – completion and explainable eligibility computation
- `lib/reviewStore.js` – in-memory review persistence for MVP
- `data/equivalencies.js` – equivalency map data
- `data/catalog.js` – degree catalog
- `data/prerequisites.js` – prerequisite graph
- `data/courseDetails.js` – catalog code-to-title labels
- `tests/*.test.js` – unit tests

## Run locally

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Test

```powershell
npm test
```

## Optional AI extraction mode

You can enable OpenAI-powered transcript row extraction before the deterministic parser step.

Create a `.env.local` file with:

```text
OPENAI_API_KEY=your_key_here
USE_AI_EXTRACTION=true
```

When disabled (or if AI extraction fails), the app automatically falls back to the normal parser flow.

## Input format (current MVP)

Each line is parsed as:

```text
Course Name | Grade | Credits
```

Example:

```text
Intro to Programming | A | 3
Calculus I | B | 4
English Composition I | C | 3
```

## Notes

- Digital PDFs are parsed via `pdf-parse` in `app/api/upload-transcript/route.js`.
- Image-only/scanned PDFs still require OCR (future enhancement).
