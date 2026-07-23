# TrueSight AI — Master Build Specification & Team Prompt Kit

One master file for building TrueSight AI (website + Chrome/Edge extension) across a 6-person
GitHub team, without different people's chats/sessions drifting apart on interfaces or scope.

## 0. How to Use This Document
- Section 2 is the **Master Context Block** — paste it into every new chat before anything else,
  regardless of which piece you're building.
- Sections 4–8 are **role-based prompts**, one per person/sub-team. Paste Section 2, then your
  section, into a new chat to build your piece.
- Commit this whole file to the repo root (e.g. `SPEC.md`) and treat the data contract in
  Section 2 as the actual source of truth for the project — not just a copy-paste convenience.
  If a field changes, it changes in this file first, in a PR everyone can see.
- Section 3 maps the sections to your team's actual Week 1–4 plan.

## 1. Team, Roles & Repo Structure

| Person | Role | Owns | Prompt |
|---|---|---|---|
| Mustafa | AI: model selection, pipeline, training/tuning, PR review & merge | `backend/ai/` | Section 4 |
| Mahdi | Backend (FastAPI, APIs, DB) + Browser Extension | `backend/`, `extension/` | Sections 5 & 7 |
| Laith | Frontend (React + Tailwind, AR/EN, UX) | `frontend/` | Section 6 |
| Malak | Datasets: sourcing, downloading, cleaning, quality | `datasets/` | Section 8 |
| Zahraa | Official sources, fact-checking sites, classification, testing | `datasets/` | Section 8 |
| Heba | Dataset merging, labeling, preprocessing, dedup | `datasets/` | Section 8 |

Suggested repo layout:
```
truesight-ai/
├── backend/
│   ├── ai/                  ← Mustafa: analysis_engine.py, system prompts, (optional) model files
│   ├── main.py               ← Mahdi: FastAPI app, routes, DB
│   └── requirements.txt
├── frontend/                 ← Laith: React + Tailwind app
├── extension/                 ← Mahdi & Mustafa: Manifest V3 extension
├── datasets/                  ← Malak, Zahraa, Heba
│   ├── raw/
│   ├── processed/
│   └── official_sources.json
├── SPEC.md                    ← this file — the single source of truth for the contract
└── docs/                      ← proposal doc, research write-ups, demo script
```
Since Mustafa is the one reviewing and merging PRs, he's the natural person to enforce that any
PR touching the request/response shape updates the contract in this file in the same PR.

## 2. Master Context Block — paste into every new chat before anything else

```
PROJECT: TrueSight AI
Tagline: Think. Verify. Understand. Then Share.

WHAT IT IS: An AI-powered website plus a Chrome/Edge browser extension. A user submits digital
content — text, a URL, or a screenshot — and gets back, in seconds:
- A Trust Score (0-100)
- A breakdown of manipulation techniques detected in the content
- A neutral rewritten version of the content, stripped of emotional/manipulative language
- Suggested categories of official sources to verify against
- One practical media-literacy tip

CORE THESIS — do not lose this, it is the entire point of the project:
Fake news and fraudulent ads are not two separate problems. Both work the same way: misleading
information designed to manipulate a decision before the person can verify it. TrueSight uses ONE
detection engine for both — not a "news checker" and a separate "ad checker." The same analysis
pipeline handles news articles, advertisements, and social posts. (Note: the team's own final
checklist emphasizes "AI News Analysis" — this spec keeps the broader news+ads thesis intact since
it's the strongest differentiator, but content_type still classifies ads/posts too. If the team has
deliberately decided to narrow to news-only for the MVP, say so and this gets simplified.)

MUST SUPPORT ARABIC AND ENGLISH. Language is detected automatically per submission, not selected
by the user. Every AI output (rewrite, tip, reasoning) is returned in the SAME language as the
input — never auto-translated. The UI itself (not just AI output) also needs both languages,
including right-to-left layout for Arabic — this is a frontend requirement, not just an AI one.

BUILT FOR: UNESCO Youth Hackathon 2026 (Media and Information Literacy theme). This is a hackathon
prototype whose job is to power a 3-minute pitch video demo. It does not need to be deployed
publicly, production-hardened, or built for scale. Prioritize a working core loop that looks good
on camera over completeness.

═══════════════════════════════════════════════════════════════════
SHARED DATA CONTRACT — every component must match this exactly, field for field.
Do not rename fields, change casing, or restructure "for simplicity." If a field needs to change,
it changes here first (in SPEC.md, via PR), then in every component that uses it.
═══════════════════════════════════════════════════════════════════

AnalysisRequest — sent BY frontend/extension TO backend:
{
  "input_type": "text" | "url" | "image",
  "content": string        // raw text, a URL, or a base64-encoded image string
}

AnalysisResult — returned BY backend TO frontend/extension:
{
  "content_type": "news" | "advertisement" | "social_post" | "other",
  "language": "ar" | "en",
  "trust_score": number,              // 0-100. Reflects manipulation RISK, not factual truth.
  "score_reasoning": string,          // one sentence, in the detected language
  "indicators": [
    {
      "category": "sensationalism" | "emotional_manipulation" | "unrealistic_promises"
                   | "pressure_tactics" | "fraud_indicators",
      "description": string,          // in the detected language
      "severity": "low" | "medium" | "high"
    }
  ],
  "neutral_rephrasing": string,       // in the detected language
  "suggested_sources": [string],      // in the detected language where possible
  "literacy_tip": string              // in the detected language
}

CommunityReport — sent BY frontend TO backend (optional/stretch, Section 9):
{
  "content_snippet": string,
  "category": "fake_news" | "scam_ad" | "misleading_post" | "other",
  "reporter_note": string
}
═══════════════════════════════════════════════════════════════════

TECH STACK (defaults — swap anything your team is faster with, but keep the contract fixed):
- Backend: Python + FastAPI, Pydantic models matching the contract exactly
- AI: an LLM API called from the backend, server-side only (never expose the key to
  frontend/extension). Anthropic Claude is a good fit: claude-haiku-4-5-20251001 is cheap and
  fast, well suited to this kind of classification-style task; claude-sonnet-5 if you want
  higher-quality analysis and can afford the latency/cost. Confirm current model names at
  docs.claude.com before building, since these get updated over time. If Mustafa wants a trained
  component (matching "training and improving the model" in his role) rather than pure prompting,
  AraBERT (aubmindlab/bert-base-arabertv2 on HuggingFace) is a well-established option for Arabic
  classification tasks; a small DistilBERT works similarly for English. That's entirely his call —
  see Section 4.
- Frontend: React + Tailwind, with a simple JSON-dictionary i18n approach (see Section 6)
- Extension: Chrome/Edge, Manifest V3
- Database: SQLite for the hackathon build — zero setup, one file
- URL content extraction: the `trafilatura` Python library — give it a URL, get back clean
  article text with ads/nav/boilerplate stripped out

BACKEND ENDPOINTS:
- GET  /health   → {"status": "ok"}                                  (build first, sanity check)
- POST /analyze  → body: AnalysisRequest,  returns: AnalysisResult    (the core feature)
- GET  /sources  → ?topic=&language=  returns matching entries from datasets/official_sources.json
- POST /reports  → body: CommunityReport,  returns: {"status": "received"}   (optional, Section 9)

CORS: the backend will be called from a website origin AND a browser extension origin
(chrome-extension://...). Enable CORS for both, or the extension call will silently fail with no
useful error message. This is the single most common thing that breaks a working backend +
extension combo — do not skip it.
```

## 3. Timeline (as agreed by the team)

- **Week 1** — Mustafa: set up AI environment, choose model(s) (→ Section 4). Mahdi: scaffold
  backend (→ Section 5). Laith: design the frontend (→ Section 6). Mustafa & Mahdi: scaffold
  extension structure (→ Section 7). Malak, Zahraa, Heba: start sourcing datasets and official
  sources (→ Section 8).
- **Week 2** — Build the MVP: connect frontend ↔ backend ↔ AI. Datasets team starts feeding real
  data/sources into the pipeline.
- **Week 3** — Improve AI accuracy, finish the extension, get Arabic + English fully working end
  to end, full-system testing.
- **Week 4** — Bug fixes, performance polish, build the presentation, record the demo video,
  package the submission.

## 4. Prompt — AI Pipeline (Mustafa)

```
[paste Section 2 above this line, then paste everything below into a new chat]

Build the core AI pipeline for TrueSight AI as a standalone Python module (backend/ai/
analysis_engine.py) that the FastAPI backend will import. Expose one function:

    def analyze_content(input_type: str, content: str) -> dict

returning a dict matching the AnalysisResult schema from the shared contract exactly, including
the "language" field.

PIPELINE STAGES (matching the task breakdown for this role):

1. Input handling by type:
   - "text": pass content directly into the pipeline.
   - "url": fetch the page and extract the main article text with `trafilatura` first. If
     extraction fails or returns near-empty text, fall back to passing the raw URL and note in
     score_reasoning that full content could not be retrieved.
   - "image": pass the image directly to a vision-capable model call, instructing it to first
     transcribe the visible text (in its original language), then run the rest of the pipeline on
     that transcription.

2. Language Detection: detect whether the content is Arabic or English. The simplest approach for
   this timeline is to have the main analysis call classify language as part of its single JSON
   response (see system prompt below) rather than running a separate detection step — one API call
   instead of two, less latency and cost. If you'd rather keep it as an explicit, swappable
   pipeline stage (e.g. to reuse language detection elsewhere, or replace it with a lightweight
   library like `langdetect` later), that's a reasonable alternative — your call, since model
   selection is your responsibility. Whichever you choose, the output "language" field must be
   accurate, since the frontend and extension both render based on it.

3. Claim Analysis + Trust Score + Neutral Rewrite: use the system prompt below, unmodified — this
   wording is the actual product logic, not a placeholder.

---
You are the analysis engine for TrueSight AI, a media literacy tool. You do not tell users what is
"true" or "false." Your job is to identify manipulation techniques in the content and help the user
think critically, not to issue verdicts on factual accuracy. The content may be in Arabic or
English — detect which, and respond entirely in that same language (except for the fixed English
field names/enum values in the JSON schema itself).

Given a piece of content (a news article, an advertisement, or a social media post), analyze it:

1. Classify content_type: "news", "advertisement", "social_post", or "other".
2. Detect language: "ar" or "en".

3. Check for these manipulation indicator categories. Only include ones actually present in the
   content — do not force a fixed number of indicators:
   - sensationalism: exaggerated or alarming language disproportionate to the underlying facts
   - emotional_manipulation: appeals to fear, outrage, tribal identity, or urgency designed to
     bypass rational evaluation
   - unrealistic_promises: guarantees, "too good to be true" claims, miracle results
   - pressure_tactics: artificial scarcity, countdown timers, "act now" framing
   - fraud_indicators: requests for payment or personal info, impersonation of authority, vague
     or unverifiable sourcing
   For each one found, give: category, a specific description referencing what's actually in the
   text (in the content's own language), and severity (low/medium/high).

4. trust_score (0-100): reflects how much manipulative/high-risk language is present, NOT whether
   the underlying claim is factually true or false — you often cannot verify that from the text
   alone, and you should not pretend to. Score based on density and severity of indicators found.
   One sentence of reasoning in score_reasoning, in the content's language.

5. neutral_rephrasing: rewrite the core claim stripped of emotional/manipulative language, in the
   SAME language as the input. If it's an ad, state the actual offer in plain terms. Under 40 words.

6. suggested_sources: 1-3 CATEGORIES of official sources relevant to the topic (e.g. "national
   Ministry of Health," "WHO," "a fact-checking organization"), in the content's language where
   possible. Never invent a specific URL or organization name you cannot verify exists — the
   backend may separately enrich this with real vetted sources from datasets/official_sources.json
   (see Section 8), so category-level suggestions here are enough.

7. literacy_tip: one short, specific, actionable habit relevant to THIS piece of content, in the
   content's language.

Respond with ONLY valid JSON matching this exact schema, no other text before or after it:
{
  "content_type": "news" | "advertisement" | "social_post" | "other",
  "language": "ar" | "en",
  "trust_score": number,
  "score_reasoning": string,
  "indicators": [{"category": string, "description": string, "severity": "low"|"medium"|"high"}],
  "neutral_rephrasing": string,
  "suggested_sources": [string],
  "literacy_tip": string
}

Example — input (English): "BREAKING: Global catastrophe will destroy the economy within HOURS!
Banks are HIDING the truth from you!!"

Output:
{
  "content_type": "news",
  "language": "en",
  "trust_score": 18,
  "score_reasoning": "Extreme, unsupported urgency language combined with an unfounded conspiracy
  claim about banks, with no specific verifiable claim or source given.",
  "indicators": [
    {"category": "sensationalism", "description": "'Global catastrophe' and 'destroy the economy'
    with no specific event named", "severity": "high"},
    {"category": "emotional_manipulation", "description": "'Banks are HIDING the truth from you'
    implies a conspiracy without evidence, designed to provoke distrust and fear",
    "severity": "high"},
    {"category": "pressure_tactics", "description": "'within HOURS' creates false urgency with no
    basis given", "severity": "medium"}
  ],
  "neutral_rephrasing": "The post claims a major economic event is imminent and that banks are
  withholding information, but provides no specific event, source, or evidence.",
  "suggested_sources": ["national central bank or finance ministry", "a fact-checking
  organization", "established financial news outlets"],
  "literacy_tip": "When a post claims institutions are 'hiding the truth' with no named source,
  that's a claim to verify independently before reacting, not a reason to trust the poster more."
}
---

Also build a small CLI test script (backend/ai/test_engine.py) that lets us run
`python test_engine.py "some text"` and see the JSON output directly, so the pipeline can be
sanity-checked before the backend wires it up at all — test with both an Arabic and an English
example before considering this done.

Use environment variable ANTHROPIC_API_KEY (or whichever provider's key) for the API key — never
hardcode it. Add a .env.example showing the expected variable name.

OPTIONAL, ONLY IF THE ABOVE IS FULLY WORKING AND TIME REMAINS: the datasets team (Section 8) is
building a labeled dataset matching this same category schema. If you want the "training and
improving the model" part of the role to go beyond prompting, that dataset can be used to fine-tune
a lightweight classifier (AraBERT for Arabic, DistilBERT for English) for the claim-analysis step
specifically, or simply to evaluate how accurate the prompted pipeline already is. Don't start this
before the core pipeline above is solid end to end — a working prompted pipeline beats an
unfinished trained one for the demo.
```

## 5. Prompt — Backend (Mahdi)

```
[paste Section 2 above this line, then paste everything below into a new chat]

Build the FastAPI backend for TrueSight AI. Assume backend/ai/analysis_engine.py already exists
(from a separate session, owned by Mustafa) exposing analyze_content(input_type: str, content:
str) -> dict matching the AnalysisResult schema in the shared contract — import and call it,
don't reimplement it.

Requirements:
1. Pydantic models for AnalysisRequest, AnalysisResult, Indicator, and CommunityReport, matching
   the shared contract field-for-field (same names, same casing, same nesting, including
   "language").
2. POST /analyze — validates an AnalysisRequest body, calls analyze_content(), returns an
   AnalysisResult. Return a clean 4xx error if input_type is "url" and the URL can't be fetched,
   or if content is empty.
3. GET /sources — query params `topic` and `language`. Reads datasets/official_sources.json
   (owned by the datasets team, Section 8) and returns matching entries. If the file doesn't
   exist yet, return an empty list rather than erroring, so this endpoint doesn't block anyone
   else's work.
4. POST /reports — validates a CommunityReport body, stores it in a local SQLite database
   (SQLModel or plain sqlite3), returns {"status": "received"}. Build only after 1–3 are solid.
5. GET /health — returns {"status": "ok"}. Build and verify this one first.
6. Enable CORS for all origins during development, and specifically make sure chrome-extension://
   origins are allowed — required for the browser extension to call this API at all, not optional.
7. Load the LLM API key from an environment variable, never hardcoded. Include a .env.example.
8. Add basic request logging so we can see what's being analyzed during demo/debug.

Give me the full project structure, a requirements.txt, and instructions to run it locally with
uvicorn on port 8000.
```

## 6. Prompt — Frontend (Laith)

```
[paste Section 2 above this line, then paste everything below into a new chat]

Build the TrueSight AI website frontend in React + Tailwind. The backend already exists at
http://localhost:8000 (from a separate session, owned by Mahdi) exposing POST /analyze and
GET /sources per the shared contract — call them with fetch, don't mock them.

Pages:
1. **Home** — the tagline, the core thesis (news and ads are both "digital manipulation," one
   engine handles both), and a prominent "Analyze Content" call to action. This is the first thing
   judges see in the pitch video — it needs to look intentional and polished, not templated.
2. **Analyze** — an input area supporting pasted text, a pasted URL, or an uploaded screenshot,
   with a type toggle or auto-detection. On submit, POST to /analyze, show a loading state (this
   can take a few seconds — don't let it look frozen), then route to Results.
3. **Results** — a dedicated view (separate route, e.g. /results) showing:
   a. Trust Score as a visual gauge/ring — green (70-100) / yellow (40-69) / red (0-39)
   b. Detected indicators as cards: category, description, severity badge
   c. The neutral rephrasing in a clearly distinct, calm-styled box — this is the signature
      feature, give it visual weight
   d. Suggested sources as a short list
   e. The literacy tip, styled distinctly
4. **News** — a feed of recently analyzed content (from your own test runs during development, or
   from community reports if Section 9 gets built) — gives the demo something to show even before
   a judge tries it live themselves.
5. **About** — team and project info.
6. **Educational Tips** — a standalone page of MIL tips, independent of any single analysis. This
   is a good page to point judges to directly, since it makes the "we teach, not just detect"
   thesis concrete on its own.

BILINGUAL (Arabic + English) — required, not optional:
- Use a simple JSON-dictionary approach for UI strings (en.json / ar.json + a React context
  providing the current language and a t() lookup function) rather than pulling in a heavy i18n
  library — faster to build and enough for this scope.
- AI-generated content (rewrite, tip, sources) is already returned in the correct language by the
  backend via the "language" field — just render it as-is, don't re-translate it.
- Arabic needs right-to-left layout: toggle a `dir="rtl"` attribute on the root element based on
  the active language, and use a font that renders Arabic well (e.g. Noto Sans Arabic or Cairo)
  alongside your Latin font.
- Put a language toggle in the header, not buried in a settings page.

Design direction: trustworthy and calm, not flashy — this is a tool about cutting through
manipulation, so the UI shouldn't feel manipulative or ad-like itself. Avoid generic
dark-mode-SaaS defaults.

Handle backend errors gracefully (a clear message, never a silent failure).
```

## 7. Prompt — Browser Extension (Mahdi & Mustafa)

```
[paste Section 2 above this line, then paste everything below into a new chat]

Build the TrueSight AI browser extension for Chrome/Edge using Manifest V3. The backend already
exists at http://localhost:8000 (from a separate session) exposing POST /analyze per the shared
contract — call it directly, don't mock it.

Use this manifest.json as the starting point:

{
  "manifest_version": 3,
  "name": "TrueSight AI",
  "version": "1.0.0",
  "description": "Verify news and ads before you trust or share them.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["http://localhost:8000/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "icons": { "128": "icon.png" }
}

Behavior:
1. Clicking the extension icon opens a popup (popup.html/js).
2. Two ways to analyze:
   a. "Analyze this page" button — content script grabs the page's main visible text
      (document.body.innerText is fine for the hackathon version), sends as input_type: "text"
   b. A paste box for text or a URL directly, with an "Analyze" button
3. Compact loading state while waiting (popup is small — don't let it look broken).
4. Results in the same visual language as the website: Trust Score as a small colored
   badge/ring, indicators as a short compact list, neutral rephrasing in its own highlighted box,
   literacy tip at the bottom. Render right-to-left automatically when the response's "language"
   field is "ar" — same rule as the website.
5. Keep the popup usable at roughly 380px width.

Only needs to run as an unpacked extension loaded via chrome://extensions for the hackathon — no
need to publish to the Chrome Web Store.
```

## 8. Prompt — Datasets & Research (Malak, Zahraa, Heba)

```
[paste Section 2 above this line, then paste everything below into a new chat]

Help build the datasets and reference data TrueSight AI's AI pipeline and backend depend on. This
splits into three connected deliverables — divide them however suits the team, but keep the
output formats below exact, since Mustafa's pipeline and Mahdi's backend consume them directly.

DELIVERABLE 1 — Official Sources Reference Database (datasets/official_sources.json):
A curated list the backend's GET /sources endpoint serves, so "suggested_sources" in results can
point to real, verified organizations instead of the AI inventing categories from memory. Format:
[
  {
    "topic": "health" | "education" | "weather" | "finance" | "general" | "politics",
    "language": "ar" | "en" | "both",
    "country": "Iraq" | "international",
    "name": string,
    "url": string,
    "type": "government" | "international_org" | "fact_checking"
  }
]
Verified starting points to build from (confirm each URL still works before adding it):
- WHO (who.int) — international, health, both languages
- UNESCO (unesco.org) — international, education, both languages
- Misbar (misbar.com) — Arabic-focused fact-checking platform covering the Arab world, publishes
  in both Arabic and English, IFCN-linked methodology
- Fatabyyano (fatabyyano.net) — Jordan-based Arabic fact-checking organization, certified by the
  International Fact-Checking Network (IFCN)
- FactCheck.org and PolitiFact (politifact.com) — established English-language political
  fact-checkers
Add Iraq-specific official sources yourselves (Ministry of Health, Ministry of Education, Iraqi
News Agency, etc.) — look up and verify current official URLs directly rather than relying on a
list handed to you, since government URLs change and a dead link looks bad in a demo.

DELIVERABLE 2 — Labeled dataset for evaluating/improving the AI pipeline (datasets/processed/):
Public datasets to start from:
- English: the LIAR dataset (~12.8K short political statements labeled for truthfulness by
  PolitiFact editors, available on Hugging Face as ucsbnlp/liar) and FakeNewsNet (Shu et al.)
- Arabic: AFND — the Arabic Fake News Dataset (~607K articles scraped from 134 news sites across
  19 Arab countries, labeled via the Misbar fact-checking platform, available on Mendeley Data)
Important: these public datasets give a real/fake or true/false label, NOT the manipulation
categories TrueSight actually uses (sensationalism, emotional_manipulation, unrealistic_promises,
pressure_tactics, fraud_indicators). Full retraining on hundreds of thousands of rows isn't
realistic on this timeline — instead, manually label a smaller subset (a few hundred examples,
split roughly evenly between Arabic and English) using TrueSight's actual category schema. This
gives Mustafa a real eval set to measure how well the AI pipeline performs, and optionally to
fine-tune a lightweight classifier later if there's time.
Preprocessing tasks: deduplicate, remove near-duplicate rows, normalize Arabic text (diacritics
removal is standard practice for Arabic NLP preprocessing), split into train/eval sets, and output
as clean CSV or JSON with columns matching the category schema exactly.

DELIVERABLE 3 — Documentation (docs/datasets.md):
For the proposal's feasibility section: where each dataset/source came from, size, licensing, and
how sources were verified. Judges weigh feasibility and credibility — a documented, real
methodology is worth more here than a bigger but unverified pile of data.
```

## 9. Optional — Community Reporting (deprioritized)

Not on the team's final checklist, and lower value than the five sections above — build only if
everything above is solid and demo-ready with time still on the clock.

```
[paste Section 2 above this line, then paste everything below into a new chat]

Add a community reporting feature to the TrueSight AI website. The backend already exists (from a
separate session) exposing POST /reports and GET /reports per the shared contract.

Build: a "Report this" button on the Results view opening a short form (category dropdown +
free-text note) that submits a CommunityReport; and a simple public "Community Reports" page
listing recent reports (newest first). Before storing a report, strip anything that looks like a
phone number, email address, or ID number from content_snippet and reporter_note with a basic
regex pass — reports may reference real people's scam messages, and the team shouldn't be the one
storing that personal data.
```

## 10. Demo & Submission Notes

- **You do not need to deploy this anywhere.** Submission is a proposal document plus a 3-minute
  pitch video — not a live public site. Run everything locally and screen-record it. This removes
  hosting, domains, and deployment entirely from the critical path.
- The moment worth building the video around: pull up a real (or realistic mock) sensational
  headline or scam-style ad in each language, click the extension, and let the Trust Score and
  neutral rewrite appear live on screen. Showing it work in both Arabic and English in the same
  recording is a strong, concrete demonstration of the bilingual requirement.
- Have the recording done before the deadline crunch, as a safety net.

## 11. Final Pre-Submission Checklist
- [ ] CORS enabled on the backend, extension origin explicitly allowed
- [ ] API key loaded from an environment variable, not hardcoded anywhere, `.env` not committed
- [ ] Website, extension, and backend all pointing at the same base URL
- [ ] Trust Score color coding consistent across website and extension (green/yellow/red)
- [ ] Arabic input produces Arabic output end-to-end (AI response, website RTL layout, extension)
- [ ] At least 2-3 realistic test cases per language ready for a smooth recording
- [ ] A backup screen recording saved before the deadline, in case anything breaks live
