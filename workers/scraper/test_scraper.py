"""Tests for scraper worker — run without live network calls."""
import pytest
from deduplicator import deduplicate, _normalize, _similarity
from linkedin_scraper import LinkedInCandidate
from secondary_scraper import SecondaryCandidate

def make_li(name, company="TechCorp", skills=None):
    return LinkedInCandidate(name=name, company=company, skills=skills or [])

def make_gh(name, company="GitCorp", skills=None):
    return SecondaryCandidate(name=name, company=company, skills=skills or [])

def test_deduplication_removes_exact_duplicate():
    candidates = [
        make_li("Alice Smith", "Acme"),
        make_gh("Alice Smith", "Acme"),
    ]
    result = deduplicate(candidates)
    assert len(result) == 1

def test_deduplication_keeps_distinct_candidates():
    candidates = [
        make_li("Alice Smith", "Acme"),
        make_gh("Bob Jones", "BuildCo"),
    ]
    result = deduplicate(candidates)
    assert len(result) == 2

def test_merge_unions_skills():
    candidates = [
        make_li("Alice Smith", "Acme", skills=["Python", "FastAPI"]),
        make_gh("Alice Smith", "Acme", skills=["React", "FastAPI"]),
    ]
    result = deduplicate(candidates)
    assert len(result) == 1
    assert set(result[0]["skills"]) == {"Python", "FastAPI", "React"}

def test_partial_profile_not_dropped():
    candidates = [
        make_li("Partial Person", company=None),
    ]
    result = deduplicate(candidates)
    assert len(result) == 1
    assert result[0]["name"] == "Partial Person"

def test_normalize_strips_punctuation():
    assert _normalize("O'Brien, Jr.") == "obrien jr"

def test_similarity_identical():
    assert _similarity("alice", "alice") == 1.0
