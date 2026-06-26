"""
red_flags.py — Detects problematic signals in candidate profiles.

Red flag categories (from PRD):
  1. Job Hopping     — >3 positions in <24 months (detected via title/summary heuristic)
  2. Title Inflation — Director/VP/C-level at what appears to be a small company
  3. Skill Mismatch  — Advanced skill keywords with very low implied experience

Each detector returns a dict or None. The main function returns a list
of all detected red flags with human-readable explanations.
"""
import re
from typing import List, Optional


INFLATED_TITLES = {
    "director", "vp", "vice president", "chief", "cto", "ceo", "coo", "cfo",
    "head of", "president", "svp", "evp", "managing director",
}

ADVANCED_SKILLS = {
    "staff engineer", "principal engineer", "distinguished engineer",
    "architect", "ml engineer", "ai researcher", "phd",
    "kubernetes admin", "platform engineer",
}

SMALL_COMPANY_PATTERNS = [
    r"\b(\d{1,2})\s*person\b",
    r"\bstartup\b",
    r"\bstealth\b",
    r"\bpre-?seed\b",
    r"\bseries [ab]\b",
]


def _check_job_hopping(candidate: dict) -> Optional[dict]:
    """
    Heuristic: if the experience_summary mentions 4+ different companies
    or the title history suggests rapid job changes.
    """
    summary = (candidate.get("experience_summary") or "").lower()
    # Count occurrences of transition phrases
    transitions = len(re.findall(
        r"\b(then|before|after|previously|joined|moved to|currently)\b",
        summary
    ))
    if transitions >= 3:
        return {
            "type": "job_hopping",
            "severity": "medium",
            "explanation": (
                "Profile mentions 3+ role transitions in the experience summary, "
                "suggesting possible job hopping."
            ),
        }
    return None


def _check_title_inflation(candidate: dict) -> Optional[dict]:
    """
    Heuristic: senior title + signals of a very small company.
    """
    title = (candidate.get("title") or "").lower()
    company = (candidate.get("company") or "").lower()

    has_inflated_title = any(t in title for t in INFLATED_TITLES)
    has_small_company = any(re.search(p, company) for p in SMALL_COMPANY_PATTERNS)

    if has_inflated_title and has_small_company:
        return {
            "type": "title_inflation",
            "severity": "low",
            "explanation": (
                f"Title '{candidate.get('title')}' appears senior but the company "
                f"'{candidate.get('company')}' may be very small, suggesting title inflation."
            ),
        }
    return None


def _check_skill_mismatch(candidate: dict) -> Optional[dict]:
    """
    Heuristic: advanced skill keywords present but overall profile
    implies junior experience (short experience_summary, junior title).
    """
    skills = [s.lower() for s in (candidate.get("skills") or [])]
    title = (candidate.get("title") or "").lower()
    summary = (candidate.get("experience_summary") or "").lower()

    has_advanced_skill = any(adv in " ".join(skills) for adv in ADVANCED_SKILLS)
    junior_signals = any(
        kw in title
        for kw in ("intern", "junior", "jr.", "associate", "trainee", "fresher", "entry")
    )
    # Very short summary can also indicate limited experience
    short_summary = len(summary.split()) < 20 and bool(summary)

    if has_advanced_skill and (junior_signals or short_summary):
        return {
            "type": "skill_mismatch",
            "severity": "high",
            "explanation": (
                "Candidate lists advanced technical skills but title/experience summary "
                "suggests limited actual experience."
            ),
        }
    return None


def detect_red_flags(candidate: dict) -> List[dict]:
    """
    Run all red-flag detectors on a candidate profile.
    Returns a list of red-flag dicts (empty list = no flags).
    """
    flags = []
    detectors = [_check_job_hopping, _check_title_inflation, _check_skill_mismatch]
    for detector in detectors:
        flag = detector(candidate)
        if flag:
            flags.append(flag)
    return flags
