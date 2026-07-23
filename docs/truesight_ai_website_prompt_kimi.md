# TrueSight AI — Website Prompt (for Kimi.ai)

Paste everything below into Kimi. It's fully self-contained — no other files needed first.

---

Build a website for **TrueSight AI**, an AI-powered media literacy tool. Tagline: *Think. Verify.
Understand. Then Share.*

## What it does
A user submits digital content — pasted text, a URL, or a screenshot — of a news article, an
advertisement, or a social media post. The site analyzes it and shows:
- A Trust Score (0-100)
- The specific manipulation techniques detected in it
- A neutral, calm rewrite of the content stripped of manipulative language
- Categories of official sources the user could check
- One practical media-literacy tip

## The core idea — keep this central to the design, not just the copy
Fake news and scam ads are not two different problems. Both use the same trick: misleading
content designed to manipulate a decision before anyone can verify it. This site treats them as
ONE problem with one analysis engine — not a "news checker" bolted to a separate "ad checker."
Every result screen should look and feel the same regardless of whether the input was a news
article, an ad, or a social post.

## Must support Arabic and English
Detected automatically from the submitted content — the user doesn't pick a language manually.
Arabic content needs right-to-left layout. Include a language toggle in the header for the
static UI text itself (nav, buttons, labels).

## Pages
1. **Home** — tagline, the core idea above in a few clear lines, a prominent "Analyze Content"
   button. This is the first thing a judge sees in a hackathon demo video — make it look
   intentional and polished, not like a generic template.
2. **Analyze** — an input area accepting pasted text, a pasted URL, or an uploaded screenshot,
   with a way to indicate which type (or auto-detect). Submitting shows a loading state, then
   the result.
3. **Results** — displays one analysis result:
   - Trust Score as a visual gauge/ring: green for 70-100, yellow for 40-69, red for 0-39
   - Detected indicators as individual cards (category, description, severity badge)
   - The neutral rephrasing in a visually distinct, calm-styled box — this is the signature
     feature, give it real visual weight
   - Suggested sources as a short list
   - The literacy tip, styled as a small distinct callout
4. **News** — a feed of a few example analyzed items, to show the tool "in action" with real
   examples even before a visitor tries it themselves.
5. **About** — short project/team description (placeholder content is fine).
6. **Educational Tips** — a standalone page of media-literacy tips, independent of any single
   analysis result.

## Data shape (use this exact structure everywhere a result is shown or created)
```
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
```

## Backend integration
Try this first: on submit, POST to `http://localhost:8000/analyze` with
`{"input_type": "text"|"url"|"image", "content": <the submitted content>}` and render the result
using the data shape above.

**If you can't make a live call to an external backend or AI model in this environment**, build
this as a front-end proof of concept instead: use a mock function that returns realistic example
results (the three below, plus 1-2 more you write in the same style) instead of a real network
call, so the full flow and bilingual UI can still be demonstrated end to end. Comment clearly in
the code exactly where a real `fetch()` call to `/analyze` would replace the mock, so swapping in
a real backend later is a one-line change, not a rebuild.

**Example 1 (English, low trust, news):**
```
{
  "content_type": "news", "language": "en", "trust_score": 18,
  "score_reasoning": "Extreme, unsupported urgency language combined with an unfounded conspiracy
  claim about banks, with no specific verifiable claim or source given.",
  "indicators": [
    {"category": "sensationalism", "description": "'Global catastrophe' and 'destroy the economy'
    with no specific event named", "severity": "high"},
    {"category": "emotional_manipulation", "description": "'Banks are HIDING the truth from you'
    implies a conspiracy without evidence", "severity": "high"},
    {"category": "pressure_tactics", "description": "'within HOURS' creates false urgency with no
    basis given", "severity": "medium"}
  ],
  "neutral_rephrasing": "The post claims a major economic event is imminent and that banks are
  withholding information, but provides no specific event, source, or evidence.",
  "suggested_sources": ["national central bank or finance ministry", "a fact-checking
  organization"],
  "literacy_tip": "When a post claims institutions are 'hiding the truth' with no named source,
  verify independently before reacting."
}
```

**Example 2 (Arabic, very low trust, advertisement)** — original content: "🎁 مبروك! ربحت جائزة
1000 دولار! اضغط الرابط الآن قبل انتهاء العرض خلال 30 دقيقة وأدخل معلوماتك البنكية للاستلام
الفوري"
```
{
  "content_type": "advertisement", "language": "ar", "trust_score": 8,
  "score_reasoning": "الإعلان يستخدم وعدًا غير واقعي بجائزة نقدية، وضغطًا زمنيًا حادًا، ويطلب
  معلومات مصرفية حساسة — مؤشرات احتيال واضحة.",
  "indicators": [
    {"category": "fraud_indicators", "description": "يطلب معلومات مصرفية مباشرة مقابل جائزة
    مزعومة", "severity": "high"},
    {"category": "unrealistic_promises", "description": "وعد بجائزة 1000 دولار دون أي شرح لكيفية
    الفوز", "severity": "high"},
    {"category": "pressure_tactics", "description": "مهلة 30 دقيقة فقط لدفع المستخدم لاتخاذ قرار
    سريع", "severity": "high"}
  ],
  "neutral_rephrasing": "إعلان يدعي منح جائزة نقدية مقابل تقديم معلومات مصرفية خلال وقت محدود، دون
  تفاصيل واضحة عن الجهة المسؤولة.",
  "suggested_sources": ["جهة حماية المستهلك الرسمية", "منصة تحقق موثوقة"],
  "literacy_tip": "أي عرض يطلب معلومات مصرفية مقابل جائزة 'مجانية' يستحق حذرًا شديدًا، خاصة إذا كان
  هناك ضغط زمني."
}
```

**Example 3 (English, high trust, news):**
```
{
  "content_type": "news", "language": "en", "trust_score": 91,
  "score_reasoning": "Neutral, factual language with no urgency or exaggeration, referencing an
  official government announcement.",
  "indicators": [],
  "neutral_rephrasing": "The Ministry of Health announced that flu vaccinations are available at
  public clinics, with details on its official website.",
  "suggested_sources": ["national Ministry of Health"],
  "literacy_tip": "Official announcements with clear sourcing are generally low-risk, but it's
  still good practice to confirm details on the official site before acting."
}
```

## Design direction
Trustworthy and calm, not flashy — this is a tool about cutting through manipulation, so the
interface itself shouldn't feel manipulative or ad-like. Avoid a generic dark-mode-SaaS template
look; give it a distinct, deliberate visual identity. Use a font that renders Arabic cleanly
(e.g. Noto Sans Arabic or Cairo) alongside your Latin font choice.
