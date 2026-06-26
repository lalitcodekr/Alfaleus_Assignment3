"""
embedder.py — Loads BAAI/bge-small-en-v1.5 at startup and exposes encode().

The model is cached in a module-level variable so it's only loaded once
per worker process startup (~50 MB, loads in ~1-2s on CPU).
"""
from typing import List
from sentence_transformers import SentenceTransformer

# Module-level cache — loaded once when the worker process starts
_model: SentenceTransformer | None = None
MODEL_NAME = "BAAI/bge-small-en-v1.5"


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        print("Embedding model loaded.")
    return _model


def encode(text: str) -> List[float]:
    """Encode a text string into a 384-dim embedding vector."""
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def encode_batch(texts: List[str]) -> List[List[float]]:
    """Encode multiple texts at once (more efficient than calling encode() in a loop)."""
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]
