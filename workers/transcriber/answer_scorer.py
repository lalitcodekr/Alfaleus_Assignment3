"""
Lightweight answer scorer — no PyTorch/sentence-transformers.
Uses TF-IDF cosine similarity for relevance (fast, CPU-only, ~zero RAM overhead).
Replaces the BGE embedding approach for the free-tier Render deployment.
"""
import math
import re
from collections import Counter


def _tokenize(text: str) -> list[str]:
    return re.findall(r'\b[a-z]{2,}\b', text.lower())


def _tfidf_cosine(a: str, b: str) -> float:
    """TF-IDF cosine similarity between two short texts."""
    tokens_a = _tokenize(a)
    tokens_b = _tokenize(b)
    if not tokens_a or not tokens_b:
        return 0.0

    all_tokens = set(tokens_a) | set(tokens_b)
    # Simple TF (term frequency) vectors
    freq_a = Counter(tokens_a)
    freq_b = Counter(tokens_b)

    vec_a = [freq_a.get(t, 0) for t in all_tokens]
    vec_b = [freq_b.get(t, 0) for t in all_tokens]

    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(x ** 2 for x in vec_a))
    norm_b = math.sqrt(sum(x ** 2 for x in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def score_answer(transcription: str, question: str) -> dict:
    """Score a transcribed interview answer against the question."""
    words = _tokenize(transcription)
    word_count = len(words)

    # 1. Relevance: TF-IDF cosine similarity (0–100)
    relevance_score = float(max(0, min(100, _tfidf_cosine(transcription, question) * 100)))

    # 2. Clarity: length heuristic (50 words = 100 score)
    clarity_score = float(min(100, word_count * 2))

    # 3. Specificity: proportion of long/domain words (>6 chars)
    long_words = [w for w in words if len(w) > 6]
    specificity_score = float(min(100, len(long_words) * 5))

    # 4. Depth: scaled word count
    depth_score = float(min(100, word_count * 1.5))

    return {
        "relevance_score": round(relevance_score, 2),
        "clarity_score": round(clarity_score, 2),
        "specificity_score": round(specificity_score, 2),
        "depth_score": round(depth_score, 2),
        "summary": "Answer scored using TF-IDF similarity and lexical heuristics.",
    }
