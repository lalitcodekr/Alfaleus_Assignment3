import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from analyzer import analyze_and_save_jd
from question_generator import generate_interview_questions
from dotenv import load_dotenv

# Load root .env
load_dotenv("../../.env")

app = FastAPI()

class AnalyzeRequest(BaseModel):
    job_id: str
    jd_text: str

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        result = await analyze_and_save_jd(req.job_id, req.jd_text)
        return {"status": "success", "data": result}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class GenerateQuestionsRequest(BaseModel):
    parsed_jd: dict
    candidate_profile: dict

@app.post("/generate-questions")
async def generate_questions(req: GenerateQuestionsRequest):
    try:
        result = await generate_interview_questions(req.parsed_jd, req.candidate_profile)
        return {"status": "success", "data": result.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
