"""
TrueSight AI — FastAPI backend.

Run locally (free, local Llama via Ollama — the default):
    pip install -r requirements.txt
    cp .env.example .env      # defaults already point at Ollama, no key needed
    # separately: install Ollama, then `ollama pull llama3.1:8b`
    uvicorn main:app --reload --port 8000

Endpoints (see SPEC.md for the full shared contract):
    GET  /health   -> {"status": "ok", "engine_backend": "...", "model": "..."}
    POST /analyze  -> AnalysisRequest in, AnalysisResult out
    GET  /sources  -> ?topic=&language=  matching rows from official_sources.json
"""

from __future__ import annotations

import json
import logging
import pathlib
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai.analysis_engine import ENGINE_BACKEND, MODEL, OLLAMA_MODEL, AnalysisError, analyze_content

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("truesight")

app = FastAPI(title="TrueSight AI", version="1.0.0")

# Enable CORS for the website origin AND the browser extension origin
# (chrome-extension://...). This is the #1 thing that breaks a working
# backend + extension combo if skipped — see SPEC.md.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASETS_DIR = pathlib.Path(__file__).resolve().parent.parent / "datasets"
SOURCES_FILE = DATASETS_DIR / "official_sources.json"


# ---------------------------------------------------------------------------
# Shared contract — Pydantic models (must match SPEC.md field-for-field)
# ---------------------------------------------------------------------------


class AnalysisRequest(BaseModel):
    input_type: Literal["text", "url", "image"]
    content: str = Field(..., min_length=1)


class Indicator(BaseModel):
    category: str
    description: str
    severity: Literal["low", "medium", "high"]


class AnalysisResult(BaseModel):
    content_type: Literal["news", "advertisement", "social_post", "other"]
    language: Literal["ar", "en"]
    trust_score: int = Field(..., ge=0, le=100)
    score_reasoning: str
    indicators: list[Indicator]
    neutral_rephrasing: str
    suggested_sources: list[str]
    literacy_tip: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    active_model = OLLAMA_MODEL if ENGINE_BACKEND == "ollama" else MODEL
    return {"status": "ok", "engine_backend": ENGINE_BACKEND, "model": active_model}


@app.post("/analyze", response_model=AnalysisResult)
def analyze(request: AnalysisRequest) -> AnalysisResult:
    preview = request.content[:80].replace("\n", " ")
    logger.info("analyze request: input_type=%s content=%r...", request.input_type, preview)

    if request.input_type == "url" and not (
        request.content.startswith("http://") or request.content.startswith("https://")
    ):
        raise HTTPException(status_code=400, detail="content must be a valid http(s) URL")

    try:
        result = analyze_content(request.input_type, request.content)
    except AnalysisError as exc:
        logger.warning("analysis failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        return AnalysisResult(**result)
    except Exception as exc:  # model returned something that doesn't fit the contract
        logger.error("model output failed schema validation: %s", exc)
        raise HTTPException(
            status_code=502, detail="Analysis engine returned an unexpected shape"
        ) from exc


@app.get("/sources")
def sources(topic: Optional[str] = None, language: Optional[str] = None) -> list[dict]:
    if not SOURCES_FILE.exists():
        return []
    try:
        entries = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        logger.error("official_sources.json is not valid JSON")
        return []

    def matches(entry: dict) -> bool:
        if topic and entry.get("topic") != topic:
            return False
        if language and entry.get("language") not in (language, "both"):
            return False
        return True

    return [e for e in entries if matches(e)]
