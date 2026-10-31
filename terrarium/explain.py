from __future__ import annotations

import os


def explain_with_gemma(report: dict) -> str:
    """Ask Gemma 4 to interpret measured evidence; never let it alter metrics."""
    api_key = os.getenv("GEMMA_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = (
                "You are Terrarium's evidence analyst. Explain the following measured test-impact "
                "experiment in plain language. Do not invent causes or change metrics. Distinguish "
                "observed facts from hypotheses. If evidence is insufficient, say so.\n\n"
                f"{report}"
            )
            response = client.models.generate_content(model=os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it"), contents=prompt)
            if response.text:
                return response.text.strip()
        except Exception as exc:
            gemma_error = type(exc).__name__
        else:
            gemma_error = "empty response"
    else:
        gemma_error = "GEMMA_API_KEY is not configured"

    valid = [m for m in report["mutations"] if m["status"] == "killed"]
    actual = sorted({test for m in valid for test in m["failing_tests"]})
    missed = sorted(set(actual) - set(report["predicted_tests"]))
    if not valid:
        return f"No valid killed mutants were observed. The trust score is unavailable. Gemma explanation skipped ({gemma_error})."
    if missed:
        return (
            f"The experiment observed {len(valid)} killed mutants and {len(actual)} distinct failing tests. "
            f"{len(missed)} failing tests were absent from the impact prediction: {', '.join(missed[:5])}. "
            "This is direct evidence of an impact-analysis blind spot; the current run does not establish "
            "whether it came from dynamic dispatch, reflection, import indirection, or incomplete graph data. "
            f"Gemma explanation unavailable ({gemma_error})."
        )
    return (
        f"The experiment observed {len(valid)} killed mutants and {len(actual)} distinct failing tests. "
        "Every observed failing test appeared in the prediction for this sample. This is encouraging "
        "sample evidence, not a guarantee for other changes or repositories. "
        f"Gemma explanation unavailable ({gemma_error})."
    )
