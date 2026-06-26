import os
import json
import anthropic
from pydantic import BaseModel
from typing import List

class InterviewQuestion(BaseModel):
    category: str # "technical", "behavioral", or "domain"
    question: str
    expected_signals: List[str]

class QuestionGenerationResult(BaseModel):
    questions: List[InterviewQuestion]

async def generate_interview_questions(parsed_jd: dict, candidate_profile: dict) -> QuestionGenerationResult:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("No ANTHROPIC_API_KEY found, using mock questions.")
        return QuestionGenerationResult(
            questions=[
                InterviewQuestion(
                    category="technical",
                    question="Can you describe a complex system you built using TypeScript and Node.js?",
                    expected_signals=["System Design", "TypeScript expertise", "Node.js"]
                ),
                InterviewQuestion(
                    category="technical",
                    question="How do you ensure data integrity in PostgreSQL under high concurrency?",
                    expected_signals=["Database design", "Concurrency control", "Transactions"]
                ),
                InterviewQuestion(
                    category="behavioral",
                    question="Tell me about a time you had to mentor a junior engineer.",
                    expected_signals=["Leadership", "Communication", "Empathy"]
                ),
                InterviewQuestion(
                    category="domain",
                    question="How do you handle scaling challenges in a fast-paced startup environment?",
                    expected_signals=["Adaptability", "Scalability", "Prioritization"]
                )
            ]
        )
        
    client = anthropic.Anthropic(api_key=api_key)
    
    prompt = f"""You are an expert technical interviewer. Generate an interview question set based on the candidate's profile and the job description.
    
    Job Description Analysis:
    {json.dumps(parsed_jd, indent=2)}
    
    Candidate Profile Summary:
    Title: {candidate_profile.get('title')}
    Skills: {candidate_profile.get('skills')}
    Experience: {candidate_profile.get('experience')}
    
    Generate exactly 4-8 questions in total:
    - >= 2 technical questions (specifically referencing the candidate's skills that overlap with the job)
    - >= 1 behavioral question (calibrated to the requested seniority_level)
    - >= 1 domain scenario question
    All questions must be open-ended, designed to be answered in 5 minutes via video/audio recording.
    
    Output strictly valid JSON matching this schema:
    {{
       "questions": [
          {{ "category": "technical", "question": "...", "expected_signals": ["..."] }}
       ]
    }}
    """
    
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )
    
    try:
        text = response.content[0].text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        result = QuestionGenerationResult.model_validate_json(text)
        return result
    except Exception as e:
        print(f"Failed to parse Claude output: {e}, text: {response.content[0].text}")
        raise e
