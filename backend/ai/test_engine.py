"""
Quick sanity check for backend/ai/analysis_engine.py — run this BEFORE wiring
up the FastAPI backend, so a broken pipeline doesn't waste time debugging the
wrong layer.

Usage:
    python test_engine.py "some text to analyze"
    python test_engine.py "https://example.com/some-article"
    python test_engine.py --demo        # runs one English + one Arabic example

Requires ANTHROPIC_API_KEY to be set (e.g. via a .env file loaded with
python-dotenv, or exported in your shell) — this makes a real API call.
"""

import json
import sys

from dotenv import load_dotenv

load_dotenv()

from analysis_engine import AnalysisError, analyze_content  # noqa: E402

DEMO_EXAMPLES = [
    (
        "en",
        "text",
        "BREAKING: Global catastrophe will destroy the economy within HOURS! "
        "Banks are HIDING the truth from you!!",
    ),
    (
        "ar",
        "text",
        "🎁 مبروك! ربحت جائزة 1000 دولار! اضغط الرابط الآن قبل انتهاء العرض خلال "
        "30 دقيقة وأدخل معلوماتك البنكية للاستلام الفوري",
    ),
]


def run_one(input_type: str, content: str) -> None:
    try:
        result = analyze_content(input_type, content)
    except AnalysisError as exc:
        print(f"AnalysisError: {exc}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    if sys.argv[1] == "--demo":
        for label, input_type, content in DEMO_EXAMPLES:
            print(f"\n--- {label} example ---")
            run_one(input_type, content)
        return

    arg = sys.argv[1]
    input_type = "url" if arg.startswith("http://") or arg.startswith("https://") else "text"
    run_one(input_type, arg)


if __name__ == "__main__":
    main()
