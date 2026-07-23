# TrueSight AI

**Think. Verify. Understand. Then Share.**

A single AI pipeline that reads news articles, ads, and social posts the same
way and returns a Trust Score, the specific manipulation techniques found,
and a calm neutral rewrite — in Arabic and English. Built from
`truesight_ai_solo_build_prompt.md` and `truesight_ai_master_build_spec.md`
(both included for reference under `docs/`), for the UNESCO Youth Hackathon
2026.

This is the **full solo build** — backend, AI pipeline, frontend, and browser
extension — not just the backend + extension pieces from the original
6-person split. See the note at the end of this file about that.

## What's verified vs. what you still need to run

By default this runs **entirely free**, using Llama through Ollama on your
own machine — no API key, no cost. Claude/Anthropic is still supported as an
optional paid alternative (see "Switching to Claude instead" below).

Everything below was actually tested in the build environment:
- The backend starts, `/health` and `/sources` respond correctly.
- The new Ollama wiring (`ENGINE_BACKEND=ollama`) was tested end-to-end
  against a stand-in server that exactly mimics Ollama's real `/api/chat`
  response shape — success in English, success in Arabic, a non-JSON model
  reply, an HTTP error from Ollama, Ollama not running at all, an image sent
  to a text-only model, and an image sent to a vision-model name — all 9
  cases produced the correct result or a clean, specific error message.
- The `/analyze` endpoint was also hit over real HTTP end-to-end (frontend
  → FastAPI → Ollama-shaped server) and returned a correctly-shaped result.
- The Claude/Anthropic path still works as before (tested with a dummy key
  — clean error, not a crash).
- The frontend builds with zero errors (`npm run build`) and was
  screenshotted in English, Arabic/RTL, and mobile widths.
- The extension popup was rendered and screenshotted in both languages.
- Every Python and JS file was syntax-checked.

**What I could not test:** a real call to your actual local Llama model,
because that needs *your* GPU and *your* Ollama install, which this build
environment doesn't have. The stand-in server matches Ollama's real,
documented response format exactly, so the wiring should work as-is — but
treat the first real run (`python test_engine.py --demo`) as the actual
proof, not this note.

## Structure

```
truesight-ai/
├── backend/            FastAPI server
│   ├── ai/
│   │   ├── analysis_engine.py   the analysis pipeline — Ollama or Claude
│   │   └── test_engine.py       CLI sanity check, run this first
│   ├── main.py          /health, /analyze, /sources
│   ├── requirements.txt
│   └── .env.example
├── datasets/
│   └── official_sources.json    seed list + 3 real Iraq-specific sources
├── frontend/            React + Vite + Tailwind website (bilingual, RTL)
├── extension/           Manifest V3 Chrome/Edge extension
└── docs/                the original planning docs, for reference
```

## Quick start — free, local Llama (default, no cost)

### 1. Install Ollama and pull a model
Go to **ollama.com**, install it, then in a terminal:
```bash
ollama pull llama3.1:8b
```
Test it directly (optional): `ollama run llama3.1:8b`, chat a bit, then `/bye`.

### 2. Backend + AI pipeline

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```
The defaults in `.env` already point at Ollama — nothing else to fill in.

Sanity-check the pipeline alone first:
```bash
cd ai
python test_engine.py --demo
```
If that prints real JSON for both the English and Arabic example, the core
engine works. Then run the server:
```bash
cd ..        # back to backend/
uvicorn main:app --reload --port 8000
```

Check `http://localhost:8000/health` → should show
`{"status":"ok","engine_backend":"ollama","model":"llama3.1:8b"}`. If
`engine_backend` doesn't say `"ollama"`, your `.env` isn't being read —
double check it's actually named `.env` (not `.env.example` or `.env.txt`)
and sits directly inside `backend/`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend must be running on port 8000 for
the Analyze page to work — CORS is already open for local dev.

### 4. Browser extension

1. Make sure the backend is running on `localhost:8000`.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked**, select the `extension/` folder.
5. Pin the extension, open it on any page, and try **Analyze this page**.

## Switching to Claude instead (optional, costs money)

If you ever want higher-quality analysis and don't mind paying per request,
open `backend/.env` and change two lines:
```
ENGINE_BACKEND=anthropic
ANTHROPIC_API_KEY=your_real_key_here
```
(Get a key at console.anthropic.com.) Everything else — frontend, extension,
schema — works identically either way; only `analysis_engine.py` cares which
backend is active. Switch back to `ENGINE_BACKEND=ollama` any time.

## Troubleshooting

- **"Could not reach Ollama at http://localhost:11434..."** — Ollama isn't
  running. Open the Ollama app, or run `ollama serve` in a terminal, then
  try again.
- **"'llama3.1:8b' is a text-only model and can't read images"** — expected;
  Llama 3.1 8B can't see images. Use Text or Link input, or pull a vision
  model: `ollama pull llama3.2-vision`, then set
  `OLLAMA_MODEL=llama3.2-vision` in `.env`.
- **Answers feel slow** — normal for a local model on modest hardware. A
  smaller model (`ollama pull llama3.2:3b`, then `OLLAMA_MODEL=llama3.2:3b`)
  trades some quality for speed.
- **Frontend loads but Analyze always fails** — the backend probably isn't
  running, or is running on a different port. Check
  `http://localhost:8000/health` loads in your browser first.

## Design notes

- The Trust Score is shown as a "signal reading" — a row of bars that's calm
  and even for trustworthy content, jagged and spiky for manipulative
  content — instead of a generic circular gauge. It's the same visual
  language on the website, the extension, and the News page examples.
- Colors, type (Fraunces for English headings, IBM Plex Sans / IBM Plex Sans
  Arabic for body text, IBM Plex Mono for the score), and RTL handling are
  all in `frontend/tailwind.config.js` and `frontend/src/index.css`.
- `datasets/official_sources.json` includes the seed list from the solo
  build doc plus three Iraq-specific sources I looked up and cross-checked
  during the build (Ministry of Health, Iraqi News Agency, Ministry of
  Education). The Ministry of Education entry has a `_verified_note` flagging
  that I couldn't 100% confirm it's currently live from here — check it
  yourself before a live demo.

## Not included (deliberately, to keep the core loop solid)

These are explicitly Phase 2 in the solo build doc — easy to add later, but
left out here so the actually-critical path (analyze → score → rewrite) got
full attention instead of being spread thin:

- The community reporting endpoint / "Report this" UI
- Full dataset curation beyond the seed list
- Deployment anywhere — the hackathon submission is a recording of this
  running locally, not a live public site

## About the scope of this build

The original planning docs split this six ways: AI pipeline (Mustafa),
backend + extension (you), frontend (Laith), datasets (Malak/Zahraa/Heba).
What's here is the **entire thing**, built solo, per the "entire project...
make the front end look majestic" ask — including the pieces that were
someone else's job on paper. If the team's own pieces are further along or
different by the time you're reading this, treat this as a working
reference/backup rather than a straight replacement for their work.
