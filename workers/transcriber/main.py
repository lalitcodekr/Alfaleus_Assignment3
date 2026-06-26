import os
import uvicorn
import asyncpg
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

from audio_extractor import extract_audio
from transcriber import transcribe
from answer_scorer import score_answer
from scorecard_generator import generate_scorecard

load_dotenv("../../.env")

app = FastAPI()

class TranscribeRequest(BaseModel):
    answer_id: str
    r2_key: str
    question_index: int
    interview_id: str

async def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise Exception("DATABASE_URL not set")
    return await asyncpg.connect(db_url)

@app.post("/transcribe")
async def process_transcription(req: TranscribeRequest):
    try:
        # 1. Download and extract audio
        print(f"Extracting audio for {req.r2_key}...")
        audio_path = extract_audio(req.r2_key)
        
        # 2. Transcribe
        print(f"Transcribing {audio_path}...")
        transcription = transcribe(audio_path)
        
        # Cleanup audio
        if os.path.exists(audio_path):
            os.remove(audio_path)
            
        # 3. Fetch Question text
        conn = await get_db_connection()
        try:
            # Get question text from interview record
            interview = await conn.fetchrow("SELECT questions FROM interviews WHERE id = $1", req.interview_id)
            
            questions = []
            if interview and interview['questions']:
                questions = json.loads(interview['questions']) if isinstance(interview['questions'], str) else interview['questions']
                
            question_text = ""
            if len(questions) > req.question_index:
                question_text = questions[req.question_index].get('question', '')
                
            # 4. Score Answer
            print(f"Scoring answer for Q{req.question_index}...")
            scores = score_answer(transcription, question_text)
            
            # 5. Write to DB
            await conn.execute("""
                UPDATE answers 
                SET transcription = $1, 
                    relevance_score = $2, 
                    clarity_score = $3, 
                    specificity_score = $4, 
                    depth_score = $5, 
                    summary = $6
                WHERE id = $7
            """, 
                transcription, 
                scores['relevance_score'], 
                scores['clarity_score'], 
                scores['specificity_score'], 
                scores['depth_score'], 
                scores['summary'],
                req.answer_id
            )
            
            # 6. Check if all answers are processed, if so, generate scorecard
            all_answers = await conn.fetch("""
                SELECT * FROM answers WHERE interview_id = $1
            """, req.interview_id)
            
            total_expected = len(questions) if questions else 4
            completed_answers = [a for a in all_answers if a['transcription'] is not None]
            
            if len(completed_answers) == total_expected:
                print("All answers transcribed. Generating scorecard...")
                
                interview_data = {"id": req.interview_id, "total_questions": total_expected}
                answers_data = [
                    {
                        "question": questions[a['question_index']]['question'] if len(questions) > a['question_index'] else f"Question {a['question_index']}",
                        "transcription": a['transcription'],
                        "relevance": a['relevance_score'],
                        "clarity": a['clarity_score'],
                    } for a in completed_answers
                ]
                
                scorecard = generate_scorecard(interview_data, answers_data)
                
                import uuid
                scorecard_id = str(uuid.uuid4().hex)[:16]
                await conn.execute("""
                    INSERT INTO scorecards (id, interview_id, aggregate_score, hire_signal, confidence, follow_up_questions, ranking_justification)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """, 
                    scorecard_id, 
                    req.interview_id, 
                    float(scorecard['aggregate_score']), 
                    scorecard['hire_signal'], 
                    float(scorecard['confidence']), 
                    json.dumps(scorecard['follow_up_questions']), 
                    scorecard['ranking_justification']
                )
                
                print("Scorecard generated successfully.")
                
        finally:
            await conn.close()
            
        return {"status": "success", "answer_id": req.answer_id}
        
    except Exception as e:
        print(f"Error processing transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)
