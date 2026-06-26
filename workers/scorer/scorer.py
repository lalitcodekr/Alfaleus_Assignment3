"""
scorer.py — Computes 4-dimension semantic scores between a candidate and a JD.

Scoring dimensions and weights (must sum to 1.0):
  - Technical Skills   40%  — required_skills vs candidate skills
  - Seniority          25%  — seniority_level vs candidate title/experience
  - Domain             20%  — domain vs candidate company/title context
  - Implicit Signals   15%  — implicit_signals vs candidate profile narrative

Each dimension score is the cosine similarity between the dimension's
JD embedding and the candidate embedding (already normalized → dot product).
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
import numpy as np
from embedder import encode, encode_batch


WEIGHTS = {
    "technical": 0.40,
    "seniority": 0.25,
    "domain": 0.20,
    "implicit": 0.15,
}


@dataclass
class ScoreResult:
    technical_score: float
    seniority_score: float
    domain_score: float
    implicit_score: float
    composite_score: float


def _cosine_sim(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two L2-normalised vectors (simple dot product)."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    dot = float(np.dot(va, vb))
    # Clamp to [0, 1] — both vectors are already normalised
    return max(0.0, min(1.0, dot))


def _build_candidate_text(candidate: dict) -> str:
    """Build a single text string representing the candidate profile."""
    parts = []
    if candidate.get("name"):
        parts.append(candidate["name"])
    if candidate.get("title"):
        parts.append(f"Current role: {candidate['title']}")
    if candidate.get("company"):
        parts.append(f"Company: {candidate['company']}")
    if candidate.get("skills"):
        skills = candidate["skills"]
        if isinstance(skills, list):
            parts.append("Skills: " + ", ".join(skills))
    if candidate.get("experience_summary"):
        parts.append(candidate["experience_summary"])
    return ". ".join(parts) if parts else "Unknown candidate"


def _build_jd_dimension_texts(parsed_jd: dict) -> Dict[str, str]:
    """Extract per-dimension text from the parsed JD object."""
    return {
        "technical": "Required skills: " + ", ".join(parsed_jd.get("required_skills", []))
                     + ". Preferred skills: " + ", ".join(parsed_jd.get("preferred_skills", [])),
        "seniority": f"Seniority level: {parsed_jd.get('seniority_level', '')}. "
                     f"Role level: {parsed_jd.get('role_level', '')}. "
                     f"Experience required: {parsed_jd.get('experience_range', '')}",
        "domain": f"Domain: {parsed_jd.get('domain', '')}",
        "implicit": "Implicit signals: " + ", ".join(parsed_jd.get("implicit_signals", [])),
    }


def score_candidate(candidate: dict, parsed_jd: dict) -> ScoreResult:
    """
    Score a candidate against a parsed JD.

    Returns raw [0, 1] scores per dimension and a weighted composite
    scaled to [0, 100].
    """
    candidate_text = _build_candidate_text(candidate)
    dim_texts = _build_jd_dimension_texts(parsed_jd)

    # Batch-encode all texts in one pass for efficiency
    all_texts = [candidate_text] + list(dim_texts.values())
    embeddings = encode_batch(all_texts)

    candidate_emb = embeddings[0]
    dim_embs = {dim: embeddings[i + 1] for i, dim in enumerate(dim_texts.keys())}

    # Per-dimension cosine similarities
    tech  = _cosine_sim(candidate_emb, dim_embs["technical"])
    sen   = _cosine_sim(candidate_emb, dim_embs["seniority"])
    dom   = _cosine_sim(candidate_emb, dim_embs["domain"])
    impl  = _cosine_sim(candidate_emb, dim_embs["implicit"])

    composite_raw = (
        tech  * WEIGHTS["technical"]
        + sen * WEIGHTS["seniority"]
        + dom * WEIGHTS["domain"]
        + impl * WEIGHTS["implicit"]
    )

    # Scale to 0-100
    composite = round(composite_raw * 100, 2)

    return ScoreResult(
        technical_score=round(tech * 100, 2),
        seniority_score=round(sen * 100, 2),
        domain_score=round(dom * 100, 2),
        implicit_score=round(impl * 100, 2),
        composite_score=composite,
    )
