import os
import asyncio
import uuid
import json
import asyncpg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

from linkedin_scraper import scrape_linkedin
from secondary_scraper import scrape_naukri
from deduplicator import deduplicate

load_dotenv("../../.env")

app = FastAPI()


class ScrapeRequest(BaseModel):
    job_id: str
    query: str                       # e.g. "Senior React Engineer Bangalore"
    max_results: Optional[int] = 50


@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    try:
        # Run both scrapers concurrently
        linkedin_results, naukri_results = await asyncio.gather(
            scrape_linkedin(req.query, max_results=req.max_results),
            scrape_naukri(req.query, max_results=req.max_results),
            return_exceptions=True,
        )

        # Gracefully handle individual scraper failures
        all_candidates = []
        if isinstance(linkedin_results, list):
            all_candidates.extend(linkedin_results)
        else:
            print(f"LinkedIn scraper failed: {linkedin_results}")

        if isinstance(naukri_results, list):
            all_candidates.extend(naukri_results)
        else:
            print(f"Naukri scraper failed: {naukri_results}")

        # Deduplicate across sources
        merged = deduplicate(all_candidates)

        # Persist to database
        db_url = os.getenv("DATABASE_URL")
        if db_url and merged:
            conn = await asyncpg.connect(db_url)
            try:
                for cand in merged:
                    cand_id = str(uuid.uuid4())
                    skills_list = cand.get("skills") or []
                    await conn.execute(
                        """
                        INSERT INTO candidates (
                            id, job_id, name, title, company, skills,
                            experience_summary, profile_url, data_confidence
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT DO NOTHING
                        """,
                        cand_id,
                        req.job_id,
                        cand.get("name"),
                        cand.get("title"),
                        cand.get("company"),
                        skills_list,
                        None,  # experience_summary filled in later by scorer
                        cand.get("profile_url"),
                        cand.get("data_confidence", "low"),
                    )
            finally:
                await conn.close()

        return {
            "status": "success",
            "candidates_found": len(merged),
            "job_id": req.job_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
