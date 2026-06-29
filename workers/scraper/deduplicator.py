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

CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1, "synthetic": 0}

AnyCandidate = Union[LinkedInCandidate, SecondaryCandidate]


def _normalize(text: str) -> str:
    """Lowercase, strip punctuation and extra spaces."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def deduplicate(candidates: List[AnyCandidate]) -> List[dict]:
    """
    Deduplicate a mixed list of LinkedInCandidate + SecondaryCandidate.
    Works entirely in dict-space after the first model_dump() call
    to avoid Pydantic model reconstruction bugs.
    """
    raw: List[dict] = [c.model_dump() for c in candidates]
    merged: List[dict] = []
    used: set[int] = set()

    for i, base in enumerate(raw):
        if i in used:
            continue
        current = dict(base)
        for j, other in enumerate(raw):
            if j <= i or j in used:
                continue
            if _is_duplicate_dicts(current, other):
                current = _merge_dicts(current, other)
                used.add(j)
        merged.append(current)
        used.add(i)

    return merged


def _is_duplicate_dicts(a: dict, b: dict, threshold: float = 0.85) -> bool:
    name_sim = _similarity(_normalize(a.get("name", "")), _normalize(b.get("name", "")))
    if name_sim < threshold:
        return False
    if a.get("company") and b.get("company"):
        return _similarity(_normalize(a["company"]), _normalize(b["company"])) >= 0.7
    return name_sim >= 0.92


def _merge_dicts(primary: dict, secondary: dict) -> dict:
    if CONFIDENCE_RANK.get(primary.get("data_confidence"), 0) >= \
       CONFIDENCE_RANK.get(secondary.get("data_confidence"), 0):
        base, extra = primary, secondary
    else:
        base, extra = secondary, primary

    return {
        **base,
        "title": base.get("title") or extra.get("title"),
        "company": base.get("company") or extra.get("company"),
        "skills": list(set((base.get("skills") or []) + (extra.get("skills") or []))),
        "profile_url": base.get("profile_url") or extra.get("profile_url"),
    }
