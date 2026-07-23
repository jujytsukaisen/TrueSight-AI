# TrueSight AI — Solo Build Prompt (Backup Plan)

Use this if you end up building the whole thing yourself. Same project, same data contract as
the team spec (SPEC.md), so nothing here is wasted if teammates' work becomes available later —
their files drop into the same repo structure with no contract changes needed. What's different
is the scope: this is sequenced as one continuous build for a single session, not six handoffs,
and cut down to what's realistic for one person to actually finish.

Paste everything below into one chat (or one continuous Claude Code session, which handles a
multi-file build like this better than separate browser tabs since it can hold the whole repo in
context). Work through Phase 1 in order — don't let it generate all five pieces at once without
verifying each one runs first. After each step, confirm it actually works before moving on.

---

## Context (paste this part first)

```
PROJECT: TrueSight AI
Tagline: Think. Verify. Understand. Then Share.

WHAT IT IS: An AI-powered website plus a Chrome/Edge browser extension. A user submits digital
content — text, a URL, or a screenshot — and gets back, in seconds: a Trust Score (0-100), a
breakdown of manipulation techniques detected, a neutral rewritten version stripped of
emotional/manipulative language, suggested categories of official sources to verify against, and
one practical media-literacy tip.

CORE THESIS: Fake news and fraudulent ads are not two separate problems — both use misleading
information to manipulate a decision before the person can verify it. One detection engine
handles news, ads, and social posts; never split this into separate "news mode" / "ad mode" logic.

MUST SUPPORT ARABIC AND ENGLISH. Language is detected automatically per submission, never
selected by the user. AI output (rewrite, tip, reasoning) is returned in the SAME language as the
input, never translated.

BUILT FOR: UNESCO Youth Hackathon 2026 (Media and Information Literacy theme), submitted as a
proposal document plus a 3-minute pitch video. It does not need to be deployed publicly,
production-hardened, or built for scale — it needs to run locally and look good on camera.

SHARED DATA CONTRACT — keep this exact everywhere it's used:

AnalysisRequest (frontend/extension → backend):
{ "input_type": "text" | "url" | "image", "content": string }

AnalysisResult (backend → frontend/extension):
{
  "content_type": "news" | "advertisement" | "social_post" | "other",
  "language": "ar" | "en",
  "trust_score": number,
  "score_reasoning": string,
  "indicators": [
    {"category": "sensationalism" | "emotional_manipulation" | "unrealistic_promises"
                  | "pressure_tactics" | "fraud_indicators",
     "description": string, "severity": "low" | "medium" | "high"}
  ],
  "neutral_rephrasing": string,
  "suggested_sources": [string],
  "literacy_tip": string
}

TECH STACK: Python + FastAPI backend, Pydantic models matching the contract exactly. An LLM API
called server-side only (never expose the key to frontend/extension) — claude-haiku-4-5-20251001
is cheap, fast, and well suited to this; confirm current model names at docs.claude.com before
building. React + Tailwind frontend. Chrome/Edge Manifest V3 extension. SQLite only if you build
the optional reporting feature in Phase 2 — skip a database entirely for Phase 1.
```

## Phase 1 — Ship This (non-negotiable, build in this exact order)

**Step 1 — AI pipeline** (`backend/ai/analysis_engine.py`)

Expose one function: `def analyze_content(input_type: str, content: str) -> dict` returning a
dict matching AnalysisResult exactly. Handle input types: "text" passes straight through; "url"
uses the `trafilatura` Python library to extract clean article text first (fall back to the raw
URL if extraction fails); "image" goes to a vision-capable model call, instructed to transcribe
visible text first, then analyze that transcription.

Use this system prompt exactly as written:

---
You are the analysis engine for TrueSight AI, a media literacy tool. You do not tell users what
is "true" or "false." Your job is to identify manipulation techniques and help the user think
critically, not to issue verdicts on factual accuracy. Content may be in Arabic or English —
detect which, and respond entirely in that language (except the fixed English field
names/enum values in the JSON schema).

1. Classify content_type: "news", "advertisement", "social_post", or "other".
2. Detect language: "ar" or "en".
3. Check for these categories, only including ones actually present:
   - sensationalism: exaggerated/alarming language disproportionate to the facts
   - emotional_manipulation: fear, outrage, tribal identity, or urgency used to bypass reasoning
   - unrealistic_promises: guarantees, "too good to be true" claims, miracle results
   - pressure_tactics: artificial scarcity, countdown timers, "act now" framing
   - fraud_indicators: requests for payment/personal info, impersonation, vague sourcing
   For each: category, a specific description referencing the actual text, severity
   (low/medium/high).
4. trust_score (0-100): reflects manipulation risk, NOT factual truth — you often can't verify
   truth from text alone and shouldn't pretend to. Base it on density/severity of indicators
   found. One sentence of reasoning in score_reasoning.
5. neutral_rephrasing: the core claim stripped of manipulative language, same language as input,
   under 40 words. For ads, state the actual offer plainly.
6. suggested_sources: 1-3 CATEGORIES of relevant official sources (e.g. "national Ministry of
   Health," "a fact-checking organization"). Never invent a specific URL/org you can't verify.
7. literacy_tip: one short, specific, actionable habit relevant to THIS content, not generic
   filler.

Respond with ONLY valid JSON, no other text:
{"content_type": "news"|"advertisement"|"social_post"|"other", "language": "ar"|"en",
"trust_score": number, "score_reasoning": string,
"indicators": [{"category": string, "description": string, "severity": "low"|"medium"|"high"}],
"neutral_rephrasing": string, "suggested_sources": [string], "literacy_tip": string}
---

Write a CLI test script (`test_engine.py`) so you can run `python test_engine.py "some text"` and
see raw JSON before wiring anything else up. Test with one Arabic and one English example before
calling this step done. Use env var ANTHROPIC_API_KEY, never hardcoded.

**Step 2 — Backend** (`backend/main.py`)

FastAPI app importing analyze_content from Step 1. Endpoints: `GET /health` → {"status":"ok"}
(build and verify first); `POST /analyze` → validates AnalysisRequest, calls analyze_content,
returns AnalysisResult, clean 4xx on bad/empty input; `GET /sources?topic=&language=` → reads
`datasets/official_sources.json` (Step 3) and returns matching entries, empty list if the file
doesn't exist yet. Enable CORS for all origins, and specifically allow chrome-extension://
origins — skipping this is the most common reason a working backend + extension silently fails
together. Run locally with uvicorn on port 8000.

**Step 3 — Official sources seed file** (`datasets/official_sources.json`)

Skip building a research pipeline for this — use this starter list directly, it's already real
and verified:

```
[
  {"topic": "health", "language": "both", "country": "international",
   "name": "World Health Organization (WHO)", "url": "https://www.who.int", "type": "international_org"},
  {"topic": "education", "language": "both", "country": "international",
   "name": "UNESCO", "url": "https://www.unesco.org", "type": "international_org"},
  {"topic": "general", "language": "ar", "country": "international",
   "name": "Misbar", "url": "https://misbar.com", "type": "fact_checking"},
  {"topic": "general", "language": "ar", "country": "international",
   "name": "Fatabyyano", "url": "https://fatabyyano.net", "type": "fact_checking"},
  {"topic": "politics", "language": "en", "country": "international",
   "name": "PolitiFact", "url": "https://www.politifact.com", "type": "fact_checking"},
  {"topic": "general", "language": "en", "country": "international",
   "name": "FactCheck.org", "url": "https://www.factcheck.org", "type": "fact_checking"}
]
```

Add Iraq-specific sources (Ministry of Health, Ministry of Education) yourself when you have ten
minutes — deliberately left out rather than guessing at government URLs that might be stale.

**Step 4 — Frontend** (`frontend/`, React + Tailwind)

Keep this to three pages for a solo build:
1. **Home** — tagline, the core thesis in a few lines, a clear "Analyze" call to action.
2. **Analyze** — one page, not two: input (text/URL/screenshot) at the top, results appear
   inline below on the same page after submit (skip separate routing to a Results page — it's
   real complexity you don't need solo). Show Trust Score as a colored gauge (green 70-100 /
   yellow 40-69 / red 0-39), indicators as cards, neutral rephrasing in a visually distinct box,
   sources list, literacy tip.
3. **Educational Tips** — a short static page of MIL tips, independent of any analysis. Cheap to
   build, and it's concrete proof of the "we teach, not just detect" thesis for judges.
Bilingual: detected-language AI output should render RTL automatically when language is "ar" (a
`dir="rtl"` toggle on the results container is enough — you don't need every UI label translated
for Phase 1, see the cut list below).

**Step 5 — Extension** (`extension/`, Manifest V3)

```
{
  "manifest_version": 3,
  "name": "TrueSight AI",
  "version": "1.0.0",
  "description": "Verify news and ads before you trust or share them.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["http://localhost:8000/*"],
  "action": {"default_popup": "popup.html", "default_icon": "icon.png"},
  "icons": {"128": "icon.png"}
}
```
Popup with an "Analyze this page" button (content script grabs `document.body.innerText`) plus a
paste box for text/URL, both calling POST /analyze. Compact result view: colored score badge,
short indicator list, highlighted rewrite box, tip. RTL when language is "ar". ~380px width.
Load unpacked via chrome://extensions — no need to publish it.

## Phase 2 — Only if Phase 1 is fully working and time remains
- Split Analyze/Results into separate routed pages; add a Home polish pass and a "News" feed page
- Full UI-chrome translation (every button/label, not just AI output) with a proper en.json/ar.json
- Community reporting (POST/GET /reports) — see the team spec's Section 9 for the exact form
- Any model training/fine-tuning — skip this entirely for a solo build. Prompting a hosted LLM is
  the right call here, full stop; there's no dataset-labeling capacity to support training solo.

## If you're running out of time, cut in this order
1. Educational Tips page — nice, not essential
2. Full UI-label translation — keep the interface chrome in English, just make sure AI *output*
   still renders correctly (including RTL) for Arabic input, since that's what a demo actually shows
3. Screenshot/image input — text + URL alone is enough to demo the core loop
4. URL fetching via trafilatura — text-only input still proves the concept if this slips
Never cut: the AI pipeline working correctly, the extension calling it live, and Arabic input
producing a correct Arabic result. That combination is the actual demo.

## Demo notes
No deployment needed — submission is a proposal doc plus a 3-minute video, not a live site. Run
everything locally and screen-record it. Have one Arabic and one English test case ready, and
record a backup take before the deadline in case anything breaks live.
