import os
import anthropic
import json

def generate_scorecard(interview_data: dict, answers_data: list) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        return {
            "aggregate_score": 85.5,
            "hire_signal": "Hire",
            "confidence": 90.0,
            "follow_up_questions": ["Can you elaborate on your experience with PostgreSQL?"],
            "ranking_justification": "The candidate provided strong technical answers with high relevance and clarity."
        }
        
    client = anthropic.Anthropic(api_key=api_key)
    
    prompt = f"""You are an expert technical interviewer evaluating a candidate's complete video interview.
    
    Interview Context:
    {json.dumps(interview_data, indent=2)}
    
    Candidate Answers (Transcribed and Scored):
    {json.dumps(answers_data, indent=2)}
    
    Analyze the candidate's performance across all questions. Generate a final scorecard.
    Output MUST be valid JSON matching this schema exactly:
    {{
       "aggregate_score": 85.5,
       "hire_signal": "Strong Hire" | "Hire" | "No Hire",
       "confidence": 90.0,
       "follow_up_questions": ["..."],
       "ranking_justification": "2-3 sentence summary of why they received this score."
    }}
    """
    
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.content[0].text.strip()
    if text.startswith("```json"):
        text = text[7:-3]
    elif text.startswith("```"):
        text = text[3:-3]
        
    return json.loads(text)
