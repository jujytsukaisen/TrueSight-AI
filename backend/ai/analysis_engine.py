"""
TrueSight AI — core analysis engine.

Exposes one function, analyze_content(), that the FastAPI backend imports and
calls. Everything else in this file is private to that one job: take raw
content (text / URL / image), run it through an LLM, and return a dict that
matches the AnalysisResult contract in SPEC.md exactly.

By default this runs entirely FREE and LOCAL using Llama through Ollama —
no API key, no cost, no internet needed once the model is downloaded.
Anthropic's Claude API is still supported as an optional alternative if you
ever want higher-quality analysis and don't mind paying for it.

Env vars (see .env.example):
    ENGINE_BACKEND       "ollama" (default, free/local) or "anthropic" (paid API).
    OLLAMA_MODEL         optional. Defaults to llama3.1:8b. Use a vision
                         model (e.g. llama3.2-vision) if you need image input.
    OLLAMA_URL           optional. Defaults to http://localhost:11434/api/chat.
    ANTHROPIC_API_KEY    required only if ENGINE_BACKEND=anthropic.
    TRUESIGHT_MODEL      optional. Defaults to claude-haiku-4-5-20251001.
"""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

import anthropic
import requests
import trafilatura

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ENGINE_BACKEND = os.environ.get("ENGINE_BACKEND", "ollama").strip().lower()
_VALID_BACKENDS = ("ollama", "anthropic")

# Haiku 4.5 is cheap/fast and well suited to this classification-style task.
# Only used when ENGINE_BACKEND=anthropic. Swap to "claude-sonnet-5" (env var
# TRUESIGHT_MODEL) if you want higher quality analysis and can afford it.
DEFAULT_MODEL = "claude-haiku-4-5-20251001"
MODEL = os.environ.get("TRUESIGHT_MODEL", DEFAULT_MODEL)
MAX_TOKENS = 1500

# Local Llama via Ollama — the default. No API key, no cost, runs entirely
# on your own machine (needs `ollama pull <model>` done first, and Ollama
# running in the background).
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")

# Small, non-exhaustive list used only to fail FAST with a clear message when
# someone uploads an image but their configured Ollama model is text-only —
# rather than waiting on a slow request that will error out anyway. If your
# vision model isn't recognized here, it'll still be tried normally.
_OLLAMA_VISION_HINTS = ("vision", "llava", "bakllava", "moondream", "minicpm-v")


def _ollama_model_supports_vision(model_name: str) -> bool:
    name = model_name.lower()
    return any(hint in name for hint in _OLLAMA_VISION_HINTS)


# This wording is the actual product logic, not a placeholder — keep it
# unmodified (see SPEC.md Section 4). If the schema ever changes, change it
# here AND in SPEC.md in the same PR.
SYSTEM_PROMPT = """You are the analysis engine for TrueSight AI, a media literacy tool. You do not tell users what is "true" or "false." Your job is to identify manipulation techniques in the content and help the user think critically, not to issue verdicts on factual accuracy. The content may be in Arabic or English — detect which, and respond entirely in that same language (except for the fixed English field names/enum values in the JSON schema itself).

Given a piece of content (a news article, an advertisement, or a social media post), analyze it:

1. Classify content_type: "news", "advertisement", "social_post", or "other".
2. Detect language: "ar" or "en".

3. Check for these manipulation indicator categories. Only include ones actually present in the content — do not force a fixed number of indicators:
   - sensationalism: exaggerated or alarming language disproportionate to the underlying facts
   - emotional_manipulation: appeals to fear, outrage, tribal identity, or urgency designed to bypass rational evaluation
   - unrealistic_promises: guarantees, "too good to be true" claims, miracle results
   - pressure_tactics: artificial scarcity, countdown timers, "act now" framing
   - fraud_indicators: requests for payment or personal info, impersonation of authority, vague or unverifiable sourcing
   For each one found, give: category, a specific description referencing what's actually in the text (in the content's own language), and severity (low/medium/high).

4. trust_score (0-100): reflects how much manipulative/high-risk language is present, NOT whether the underlying claim is factually true or false — you often cannot verify that from the text alone, and you should not pretend to. Score based on density and severity of indicators found. One sentence of reasoning in score_reasoning, in the content's language.

5. neutral_rephrasing: rewrite the core claim stripped of emotional/manipulative language, in the SAME language as the input. If it's an ad, state the actual offer in plain terms. Under 40 words.

6. suggested_sources: 1-3 CATEGORIES of official sources relevant to the topic (e.g. "national Ministry of Health," "WHO," "a fact-checking organization"), in the content's language where possible. Never invent a specific URL or organization name you cannot verify exists — the backend may separately enrich this with real vetted sources from datasets/official_sources.json, so category-level suggestions here are enough.

7. literacy_tip: one short, specific, actionable habit relevant to THIS piece of content, in the content's language.

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
}"""

_REQUIRED_KEYS = {
    "content_type",
    "language",
    "trust_score",
    "score_reasoning",
    "indicators",
    "neutral_rephrasing",
    "suggested_sources",
    "literacy_tip",
}


class AnalysisError(Exception):
    """Raised when content can't be analyzed at all (bad input, dead URL,
    unparseable model response). The backend catches this and turns it into
    a clean HTTP error — it should never reach the client as a 500 traceback."""


def _client() -> anthropic.Anthropic:
    # anthropic.Anthropic() reads ANTHROPIC_API_KEY from the environment on
    # its own — this just gives us a clearer error if it's missing.
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise AnalysisError(
            "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    return anthropic.Anthropic()


def _call_anthropic(user_message) -> str:
    client = _client()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIStatusError as exc:
        raise AnalysisError(f"Claude API error ({exc.status_code}): {exc.message}") from exc
    except anthropic.APIConnectionError as exc:
        raise AnalysisError(f"Could not reach the Claude API: {exc}") from exc

    raw_text = "".join(block.text for block in response.content if block.type == "text")
    if not raw_text:
        raise AnalysisError("Model returned no text content")
    return raw_text


def _call_ollama(user_message) -> str:
    """Same job as _call_anthropic, but against a local Ollama server —
    no API key, runs entirely on your own machine."""
    images: list[str] = []
    text_part = user_message
    if isinstance(user_message, list):
        # Anthropic-style multimodal blocks (from the image branch below) —
        # translate to Ollama's flatter { content, images } message shape.
        text_chunks = []
        for block in user_message:
            if block["type"] == "image":
                images.append(block["source"]["data"])
            elif block["type"] == "text":
                text_chunks.append(block["text"])
        text_part = "\n".join(text_chunks)

    message: dict[str, Any] = {"role": "user", "content": text_part}
    if images:
        message["images"] = images

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, message],
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.2},
    }
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
    except requests.ConnectionError as exc:
        raise AnalysisError(
            f"Could not reach Ollama at {OLLAMA_URL} — is it running? Try `ollama serve` "
            f"(or just open the Ollama app) and make sure you've run "
            f"`ollama pull {OLLAMA_MODEL}` first."
        ) from exc
    except requests.Timeout as exc:
        raise AnalysisError("Ollama took too long to respond (120s timeout)") from exc
    except requests.HTTPError as exc:
        detail = resp.text[:300] if resp is not None else str(exc)
        if images and "does not support" in detail.lower():
            raise AnalysisError(
                f"{OLLAMA_MODEL} can't read images. Set OLLAMA_MODEL to a vision model "
                f"(e.g. `ollama pull llama3.2-vision` then OLLAMA_MODEL=llama3.2-vision "
                f"in .env), or use text/link input instead."
            ) from exc
        raise AnalysisError(f"Ollama error: {detail}") from exc

    raw_text = resp.json().get("message", {}).get("content", "")
    if not raw_text:
        raise AnalysisError("Ollama returned no content")
    return raw_text


def _extract_json(raw_text: str) -> dict[str, Any]:
    """The model is told to return ONLY JSON, but strip code fences / stray
    whitespace defensively in case it doesn't listen perfectly."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # If there's any stray text around the object, grab the outermost braces.
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise AnalysisError(f"Model response wasn't valid JSON: {exc}") from exc


def _validate_and_fill(result: dict[str, Any]) -> dict[str, Any]:
    """Light defensive pass — fills in safe defaults for anything the model
    might have dropped, so a minor omission doesn't break the whole request."""
    missing = _REQUIRED_KEYS - result.keys()
    if "trust_score" in missing or "language" in missing:
        # These two are load-bearing for the frontend (RTL + gauge color) —
        # if either is missing the response isn't usable.
        raise AnalysisError(f"Model response missing required field(s): {missing}")
    result.setdefault("content_type", "other")
    result.setdefault("score_reasoning", "")
    result.setdefault("indicators", [])
    result.setdefault("neutral_rephrasing", "")
    result.setdefault("suggested_sources", [])
    result.setdefault("literacy_tip", "")
    try:
        result["trust_score"] = max(0, min(100, int(round(float(result["trust_score"])))))
    except (TypeError, ValueError):
        raise AnalysisError("Model returned a non-numeric trust_score")
    return result


def _resolve_url(url: str) -> tuple[str, bool]:
    """Returns (content_to_send, extraction_failed)."""
    url = url.strip()
    downloaded = None
    try:
        downloaded = trafilatura.fetch_url(url)
    except Exception:
        downloaded = None
    extracted = trafilatura.extract(downloaded) if downloaded else None
    if extracted and len(extracted.strip()) >= 50:
        return extracted.strip(), False
    # Fallback per SPEC.md: pass the raw URL through and let the model know
    # so it can say so in score_reasoning, rather than silently guessing.
    note = (
        "[Note: automatic extraction of this URL's article text failed — only the "
        "URL itself is available below. Mention in score_reasoning, in the content's "
        "detected language, that full content could not be retrieved and this "
        "analysis is based on limited information.]\n"
        f"URL: {url}"
    )
    return note, True


def _parse_image_payload(content: str) -> tuple[str, str]:
    """Accepts either a raw base64 string or a data: URL, returns (media_type, b64_data)."""
    if content.startswith("data:"):
        header, _, b64_data = content.partition(",")
        media_type = header[5:].split(";")[0] or "image/png"
        return media_type, b64_data
    return "image/png", content


def analyze_content(input_type: str, content: str) -> dict[str, Any]:
    """
    input_type: "text" | "url" | "image"
    content:    raw text, a URL, or a base64-encoded image string

    Returns a dict matching the AnalysisResult schema. Raises AnalysisError
    on anything unrecoverable — the caller (backend/main.py) is responsible
    for turning that into a clean HTTP response.
    """
    if input_type not in ("text", "url", "image"):
        raise AnalysisError(f"Unknown input_type: {input_type!r}")
    if not content or not content.strip():
        raise AnalysisError("content is empty")
    if ENGINE_BACKEND not in _VALID_BACKENDS:
        raise AnalysisError(
            f"ENGINE_BACKEND={ENGINE_BACKEND!r} is not valid — set it to "
            f"'ollama' or 'anthropic' in your .env file."
        )
    if (
        input_type == "image"
        and ENGINE_BACKEND == "ollama"
        and not _ollama_model_supports_vision(OLLAMA_MODEL)
    ):
        raise AnalysisError(
            f"'{OLLAMA_MODEL}' is a text-only model and can't read images. Either use "
            f"the Text or Link input instead, or pull a vision model — e.g. run "
            f"`ollama pull llama3.2-vision` and set OLLAMA_MODEL=llama3.2-vision in .env."
        )

    if input_type == "image":
        media_type, b64_data = _parse_image_payload(content)
        user_message = [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": b64_data},
            },
            {
                "type": "text",
                "text": (
                    "First transcribe the visible text in this image exactly as written, "
                    "in its original language. Then run your full analysis on that "
                    "transcribed text per your instructions, and respond with the JSON "
                    "schema only."
                ),
            },
        ]
    else:
        if input_type == "url":
            text_content, _extraction_failed = _resolve_url(content)
        else:
            text_content = content
        user_message = text_content

    if ENGINE_BACKEND == "ollama":
        raw_text = _call_ollama(user_message)
    else:
        raw_text = _call_anthropic(user_message)

    result = _extract_json(raw_text)
    return _validate_and_fill(result)
