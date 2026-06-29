import os
import uuid
import json
import asyncpg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

from embedder import encode
from scorer import score_candidate
from red_flags import detect_red_flags

load_dotenv("../../.env")

app = FastAPI()


class ScoreRequest(BaseModel):
    job_id: str
    candidate_id: str
    shortlist_threshold: Optional[float] = 70.0


async def _fetch_candidate_and_jd(conn, candidate_id: str, job_id: str):
    candidate_row = await conn.fetchrow(
        "SELECT * FROM candidates WHERE id = $1", candidate_id
    )
    job_row = await conn.fetchrow(
        "SELECT * FROM jobs WHERE id = $1", job_id
    )
    return candidate_row, job_row


@app.post("/score")
async def score(req: ScoreRequest):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not set")

    conn = await asyncpg.connect(db_url)
    try:
        candidate_row, job_row = await _fetch_candidate_and_jd(
            conn, req.candidate_id, req.job_id
        )

        if not candidate_row or not job_row:
            raise HTTPException(status_code=404, detail="Candidate or Job not found")

        # Build dicts from DB rows
        candidate = dict(candidate_row)
        # skills is stored as a Postgres array — asyncpg returns it as a list already
        if candidate.get("skills") and not isinstance(candidate["skills"], list):
            candidate["skills"] = list(candidate["skills"])

        parsed_jd = job_row["parsed_jd"]
        if isinstance(parsed_jd, str):
            parsed_jd = json.loads(parsed_jd)
        if not parsed_jd:
            parsed_jd = {}

        # --- Step 1: Compute semantic scores ---
        result = score_candidate(candidate, parsed_jd)

        # --- Step 2: Detect red flags ---
        flags = detect_red_flags(candidate)

        # --- Step 3: Determine auto-shortlist ---
        threshold = req.shortlist_threshold or job_row.get("shortlist_threshold") or 70.0
        shortlisted = result.composite_score >= threshold

        # --- Step 4: Generate candidate embedding and store it ---
        candidate_text = (
            f"{candidate.get('title', '')} {candidate.get('company', '')} "
            + " ".join(candidate.get("skills") or [])
        )
        embedding = encode(candidate_text)
        embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"

        # --- Step 5: Upsert candidate_scores ---
        score_id = str(uuid.uuid4())
        existing = await conn.fetchrow(
            "SELECT id FROM candidate_scores WHERE candidate_id = $1", req.candidate_id
        )
        if existing:
            await conn.execute(
                """
                UPDATE candidate_scores SET
                    technical_score = $1,
                    seniority_score = $2,
                    domain_score = $3,
                    implicit_score = $4,
                    composite_score = $5,
                    red_flags = $6,
                    shortlisted = $7
                WHERE candidate_id = $8
                """,
                result.technical_score, result.seniority_score,
                result.domain_score, result.implicit_score,
                result.composite_score,
                json.dumps(flags),
                shortlisted,
                req.candidate_id,
            )
        else:
            await conn.execute(
                """
                INSERT INTO candidate_scores (
                    id, candidate_id, technical_score, seniority_score,
                    domain_score, implicit_score, composite_score,
                    red_flags, shortlisted
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                score_id, req.candidate_id,
                result.technical_score, result.seniority_score,
                result.domain_score, result.implicit_score,
                result.composite_score,
                json.dumps(flags),
                shortlisted,
            )

        # --- Step 6: Update candidate embedding in pgvector column ---
        await conn.execute(
            "UPDATE candidates SET embedding = $1::vector WHERE id = $2",
            embedding_str, req.candidate_id,
        )

        if shortlisted:
            print(
                f"[Auto-shortlist] Candidate {req.candidate_id} "
                f"score={result.composite_score} >= threshold={threshold}"
            )

        return {
            "candidate_id": req.candidate_id,
            "composite_score": result.composite_score,
            "technical_score": result.technical_score,
            "seniority_score": result.seniority_score,
            "domain_score": result.domain_score,
            "implicit_score": result.implicit_score,
            "red_flags": flags,
            "shortlisted": shortlisted,
        }

    finally:
        await conn.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
