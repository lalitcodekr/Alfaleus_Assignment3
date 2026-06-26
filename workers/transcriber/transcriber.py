from faster_whisper import WhisperModel
import os

print("Loading Whisper model...")
# Use 'base' model for speed in this demo
model = WhisperModel("base", device="cpu", compute_type="int8")
print("Whisper model loaded.")

def transcribe(audio_path: str) -> str:
    if not os.getenv('R2_ACCOUNT_ID'):
        return "This is a mocked transcription of the candidate's answer. They explained their experience well and went into detail about their previous roles."
        
    segments, info = model.transcribe(audio_path, beam_size=5)
    
    text = []
    for segment in segments:
        text.append(segment.text)
        
    return " ".join(text)
