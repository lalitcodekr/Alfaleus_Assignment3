"""Automated tests for scorer worker."""
import pytest
from scorer import score_candidate, ScoreResult

MOCK_JD = {
    "required_skills": ["React", "TypeScript", "Next.js", "Node.js"],
    "preferred_skills": ["GraphQL", "Docker"],
    "seniority_level": "Senior",
    "role_level": "IC",
    "experience_range": "4-7 years",
    "domain": "SaaS",
    "implicit_signals": ["fast-paced", "startup tolerance"],
}

STRONG_CANDIDATE = {
    "name": "Alex Test",
    "title": "Senior Frontend Engineer",
    "company": "Acme SaaS",
    "skills": ["React", "TypeScript", "Next.js", "Node.js", "GraphQL"],
    "experience_summary": "4 years building distributed web applications",
}

WEAK_CANDIDATE = {
    "name": "Bob Test",
    "title": "PHP Developer",
    "company": "Local Shop",
    "skills": ["PHP", "WordPress", "MySQL"],
    "experience_summary": "",
}

def test_score_returns_score_result():
    result = score_candidate(STRONG_CANDIDATE, MOCK_JD)
    assert isinstance(result, ScoreResult)

def test_strong_candidate_scores_higher_than_weak():
    strong = score_candidate(STRONG_CANDIDATE, MOCK_JD)
    weak = score_candidate(WEAK_CANDIDATE, MOCK_JD)
    assert strong.composite_score > weak.composite_score, (
        f"Strong ({strong.composite_score}) should beat weak ({weak.composite_score})"
    )

def test_score_differentiates_by_at_least_4_points():
    strong = score_candidate(STRONG_CANDIDATE, MOCK_JD)
    weak = score_candidate(WEAK_CANDIDATE, MOCK_JD)
    diff = strong.composite_score - weak.composite_score
    assert diff >= 4, f"Expected >=4 point gap, got {diff:.1f}"

def test_scores_bounded_0_to_100():
    result = score_candidate(STRONG_CANDIDATE, MOCK_JD)
    for field in ["technical_score", "seniority_score", "domain_score",
                  "implicit_score", "composite_score"]:
        val = getattr(result, field)
        assert 0 <= val <= 100, f"{field}={val} out of range"

def test_partial_candidate_still_scores():
    partial = {"name": "Partial User", "title": "Developer"}
    result = score_candidate(partial, MOCK_JD)
    assert result.composite_score >= 0
