"""
embedder.py — BAAI/bge-small-en-v1.5 via fastembed (ONNX runtime).
fastembed uses ONNX instead of PyTorch — memory footprint ~60 MB
vs ~400 MB with sentence-transformers. Drop-in replacement.
Model is downloaded at Docker build time (see Dockerfile).
"""
from typing import List
from fastembed import TextEmbedding

_model: TextEmbedding | None = None
MODEL_NAME = "BAAI/bge-small-en-v1.5"


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        _model = TextEmbedding(MODEL_NAME)
        print("Embedding model loaded.")
    return _model


def encode(text: str) -> List[float]:
    """Encode a single text string into a 384-dim normalised embedding."""
    model = _get_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()


def encode_batch(texts: List[str]) -> List[List[float]]:
    """Encode multiple texts in one ONNX pass."""
    model = _get_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]
