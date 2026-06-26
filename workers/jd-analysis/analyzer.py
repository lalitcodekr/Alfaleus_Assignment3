import os
import json
import anthropic
import asyncpg
from pydantic import BaseModel
from typing import List

class JDAnalysis(BaseModel):
    required_skills: List[str]
    preferred_skills: List[str]
    experience_range: str
    seniority_level: str
    role_level: str
    implicit_signals: List[str]
    domain: str

async def analyze_and_save_jd(job_id: str, jd_text: str) -> JDAnalysis:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("No ANTHROPIC_API_KEY found, using mock analysis.")
        analysis = JDAnalysis(
            required_skills=["TypeScript", "React", "Node.js"],
            preferred_skills=["PostgreSQL", "AWS"],
            experience_range="3-5 years",
            seniority_level="Mid-Senior",
            role_level="IC",
            implicit_signals=["Fast-paced", "Startup environment"],
            domain="Software Engineering"
        )
    else:
        client = anthropic.Anthropic(api_key=api_key)
        prompt = f"""You are an expert technical recruiter. Analyze the following job description and extract structured information.
        
        Job Description:
        {jd_text}
        
        Extract exactly these fields as JSON: required_skills, preferred_skills, experience_range, seniority_level, role_level, implicit_signals, domain. Output ONLY valid JSON."""
        
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        try:
            # Simple cleanup in case Claude adds markdown blocks
            text = response.content[0].text.strip()
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
                
            analysis = JDAnalysis.model_validate_json(text)
        except Exception as e:
            print(f"Failed to parse Claude output: {e}, text: {response.content[0].text}")
            raise e

    # Save to Neon database
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        conn = await asyncpg.connect(db_url)
        try:
            await conn.execute(
                "UPDATE jobs SET parsed_jd = $1, status = 'scraped_pending' WHERE id = $2",
                analysis.model_dump_json(),
                job_id
            )
        finally:
            await conn.close()
            
    return analysis
