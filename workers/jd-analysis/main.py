import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from analyzer import analyze_and_save_jd
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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
