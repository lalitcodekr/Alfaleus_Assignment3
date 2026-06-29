"""Tests for red flag detection."""
from red_flags import detect_red_flags

def test_no_flags_clean_profile():
    flags = detect_red_flags({
        "name": "Clean Dev",
        "title": "Senior Engineer",
        "company": "Big Tech Inc",
        "skills": ["Python", "Kubernetes"],
        "experience_summary": "I have been working at Big Tech for 5 years.",
    })
    assert flags == []

def test_detects_skill_mismatch():
    flags = detect_red_flags({
        "name": "Junior Dev",
        "title": "junior developer intern",
        "company": "Startup",
        "skills": ["kubernetes admin", "principal engineer"],
        "experience_summary": "6 months experience",
    })
    types = [f["type"] for f in flags]
    assert "skill_mismatch" in types

def test_detects_title_inflation():
    flags = detect_red_flags({
        "name": "Big Title",
        "title": "chief technology officer",
        "company": "5 person startup",
        "skills": [],
        "experience_summary": "",
    })
    types = [f["type"] for f in flags]
    assert "title_inflation" in types

def test_flag_has_required_fields():
    flags = detect_red_flags({
        "name": "T",
        "title": "intern",
        "company": "startup",
        "skills": ["staff engineer"],
        "experience_summary": "new",
    })
    for flag in flags:
        assert "type" in flag
        assert "severity" in flag
        assert "explanation" in flag
