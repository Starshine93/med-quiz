# Медицинский тест — Russian Medical Quiz

Static SPA quiz app built from medical lecture PDF slide decks. All questions are authored
directly into JSON — no runtime API calls, no backend.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Data**: Plain JSON files under `data/`
- **Validation**: Node.js script — `scripts/validate.cjs`

## Directory Structure

```
med_quiz/
├── source-pdfs/          Raw source PDFs (one topic per file)
├── data/
│   ├── topics.json       Topic metadata + honest capacity estimates
│   ├── manifest.json     App-facing index (auto-updated by validator)
│   └── questions/
│       └── <topicId>.json   Question bank per topic
├── scripts/
│   └── validate.cjs       Schema + quality validator (no network)
├── src/                  React app source
├── GENERATE.md           Workflow for adding more questions (paste into Claude Opus)
├── index.html
├── package.json
└── README.md
```

## Adding a New PDF

1. Drop the PDF into `source-pdfs/`.
2. Add an entry to `data/topics.json` with a new unique `id`.
3. Add the same entry to `data/manifest.json` (`questionCount: 0`).
4. Create an empty `data/questions/<id>.json` containing `[]`.
5. Switch Claude to **Opus** (see model-aware workflow below) and use `GENERATE.md` to author questions.
6. Run `node scripts/validate.cjs` — the manifest `questionCount` is updated automatically.
7. Rebuild: `npm run build`.

## Model-Aware Workflow

> **Note**: `/model` is unavailable in some environments. Check current model via `/status` in the VS Code extension status bar (it may show a stale value — reload the extension to refresh).

| Task | Recommended model |
|------|-------------------|
| Scaffolding, UI, scripts, routine work | Sonnet |
| Authoring medical questions (understanding slides, plausible distractors, no hallucinations) | **Opus** |

Switch before authoring: `/model` → Opus, confirm with `/status`.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + Vite build → dist/
npm run preview      # preview the build locally
node scripts/validate.cjs             # validate all question files
node scripts/validate.cjs <topicId>   # validate one topic
```

## Question JSON Schema

Each entry in `data/questions/<topicId>.json`:

```json
{
  "id": "anatomy-heart-001",
  "topicId": "anatomy-heart",
  "question": "Сколько камер имеет сердце?",
  "options": ["2", "3", "4", "6"],
  "correctIndex": 2,
  "explanation": "Сердце состоит из 4 камер: правое и левое предсердия, правый и левый желудочки.",
  "difficulty": "easy",
  "tags": ["анатомия", "сердце"]
}
```

- `correctIndex` — 0-based index of the correct option in `options`.
- `difficulty` — `"easy"` | `"medium"` | `"hard"`.
- All text fields must be in Russian.

## Deploying

The build output in `dist/` is a fully static site. Deploy to any static host
(GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.) with no server configuration needed.

For GitHub Pages: set `base` in `vite.config.ts` to your repo name, e.g. `base: '/med-quiz/'`.

## Generating More Questions

See [`GENERATE.md`](./GENERATE.md) for the paste-ready template to use with Claude Opus.
