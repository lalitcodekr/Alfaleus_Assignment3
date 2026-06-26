"""
deduplicator.py — Merges candidates from multiple sources.

Deduplication logic:
  - Primary key: (normalized_name, normalized_company) — fuzzy match via SequenceMatcher
  - When merged: union skills, prefer highest data_confidence record
  - Confidence levels: high > medium > low
"""
import re
from difflib import SequenceMatcher
from typing import List, Union
from linkedin_scraper import LinkedInCandidate
from secondary_scraper import SecondaryCandidate

CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1}

AnyCandidate = Union[LinkedInCandidate, SecondaryCandidate]


def _normalize(text: str) -> str:
    """Lowercase, strip punctuation and extra spaces."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def _is_duplicate(a: AnyCandidate, b: AnyCandidate, threshold: float = 0.85) -> bool:
    """Returns True if two candidates refer to the same person."""
    name_sim = _similarity(
        _normalize(a.name),
        _normalize(b.name),
    )
    if name_sim < threshold:
        return False
    if a.company and b.company:
        company_sim = _similarity(
            _normalize(a.company),
            _normalize(b.company),
        )
        return company_sim >= 0.7
    return name_sim >= 0.92  # No company — require higher name similarity


def _merge(primary: AnyCandidate, secondary: AnyCandidate) -> dict:
    """Merge two candidate records, preferring the higher-confidence one."""
    if CONFIDENCE_RANK.get(primary.data_confidence, 0) >= CONFIDENCE_RANK.get(secondary.data_confidence, 0):
        base, extra = primary, secondary
    else:
        base, extra = secondary, primary

    merged_skills = list(set((base.skills or []) + (extra.skills or [])))

    return {
        "name": base.name,
        "title": base.title or extra.title,
        "company": base.company or extra.company,
        "skills": merged_skills,
        "profile_url": base.profile_url or extra.profile_url,
        "source": base.source,
        "data_confidence": base.data_confidence,
    }


def deduplicate(candidates: List[AnyCandidate]) -> List[dict]:
    """
    Deduplicate and merge a mixed list of LinkedIn + secondary candidates.
    Returns a flat list of merged candidate dicts.
    """
    merged: List[dict] = []
    used = set()

    for i, cand in enumerate(candidates):
        if i in used:
            continue
        current = cand.model_dump()
        for j, other in enumerate(candidates):
            if j <= i or j in used:
                continue
            if _is_duplicate(cand, other):
                current = _merge(
                    # Convert back to model instances for merge logic
                    type(cand)(**{k: v for k, v in current.items() if k in cand.model_fields}),
                    other,
                )
                used.add(j)
        merged.append(current)
        used.add(i)

    return merged
