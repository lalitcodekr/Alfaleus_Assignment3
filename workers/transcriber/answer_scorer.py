import numpy as np
from sentence_transformers import SentenceTransformer

print("Loading BGE model for scoring...")
embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
print("BGE model loaded.")

def score_answer(transcription: str, question: str) -> dict:
    # 1. Relevance: cosine similarity
    ans_emb = embedder.encode(transcription)
    q_emb = embedder.encode(question)
    relevance = np.dot(ans_emb, q_emb) / (np.linalg.norm(ans_emb) * np.linalg.norm(q_emb))
    relevance_score = float(max(0, min(100, relevance * 100)))
    
    # 2. Clarity: proxy by length and structure (simple heuristic for demo)
    words = transcription.split()
    clarity_score = float(min(100, len(words) * 2)) # very naive
    
    # 3. Specificity: count of long words as proxy for domain terms
    specificity_score = float(min(100, len([w for w in words if len(w) > 6]) * 5))
    
    # 4. Depth: word count proxy
    depth_score = float(min(100, len(words) * 1.5))
    
    return {
        "relevance_score": relevance_score,
        "clarity_score": clarity_score,
        "specificity_score": specificity_score,
        "depth_score": depth_score,
        "summary": "Candidate provided a concise answer."
    }
