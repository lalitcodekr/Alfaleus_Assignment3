import os
import boto3
import ffmpeg
import tempfile

def get_s3_client():
    return boto3.client('s3',
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
        region_name='auto'
    )

def extract_audio(r2_key: str) -> str:
    """Downloads video from R2, extracts 16kHz mono audio, returns path to audio file."""
    bucket = os.getenv('R2_BUCKET_NAME', 'alfaleus-interviews')
    
    # Mocking for local dev if R2 is not configured
    if not os.getenv('R2_ACCOUNT_ID'):
        print(f"Mocking extraction for {r2_key}")
        # Create a mock wav file
        fd, audio_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        return audio_path

    s3 = get_s3_client()
    
    # Download video to temp file
    fd, video_path = tempfile.mkstemp(suffix=".webm")
    os.close(fd)
    
    s3.download_file(bucket, r2_key, video_path)
    
    # Extract audio
    fd, audio_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    
    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, ac=1, ar='16000') # 16kHz mono
            .overwrite_output()
            .run(quiet=True)
        )
    finally:
        # Clean up video
        os.remove(video_path)
        
    return audio_path
