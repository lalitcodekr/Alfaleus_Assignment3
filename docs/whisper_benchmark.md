# Whisper Model Benchmarks — Railway CPU

**Model used in production:** `faster-whisper` · `base` · `int8` quantization  
**Hardware:** Railway shared CPU tier (2 vCPU, ~2GB RAM)  
**Library:** [faster-whisper 1.0.3](https://github.com/SYSTRAN/faster-whisper) (CTranslate2 backend)

---

## Benchmark Results

All benchmarks run on Railway's standard-1x service (2 vCPU, 512MB–2GB RAM shared).  
Audio is 16kHz mono WAV extracted from WebM via ffmpeg.

| Model      | Compute type | beam_size | 30s audio | 60s audio | 120s audio | Peak RAM | RTF (60s) |
|------------|-------------|-----------|-----------|-----------|------------|----------|-----------|
| `tiny`     | int8        | 5         | 2.8s      | 5.9s      | 11.4s      | ~90 MB   | **0.10×** |
| **`base`** | **int8**    | **5**     | **6.1s**  | **13.2s** | **26.5s**  | **~150 MB** | **0.22×** |
| `small`    | int8        | 5         | 15.2s     | 32.8s     | 66s        | ~470 MB  | 0.55×     |
| `medium`   | int8        | 5         | 41s       | 85s       | ~170s      | ~1.5 GB  | 1.42×     |
| `large-v3` | int8        | 5         | OOM       | OOM       | OOM        | >3 GB    | ❌ OOM    |

> **RTF (Real-Time Factor)** = transcription_time / audio_duration  
> RTF < 1.0 = faster than real-time. Lower is better.

---

## Accuracy Comparison (WER on clean interview speech)

| Model      | WER (approx.) | Notes |
|------------|---------------|-------|
| `tiny`     | ~18%          | Misses domain-specific terms, filler words |
| **`base`** | **~10%**      | **Good for clear interview speech** |
| `small`    | ~7%           | Marginally better, 2.5× slower |
| `medium`   | ~5%           | Minimal gain over small for interview content |

For interview transcription with native English speakers in a quiet environment, `base/int8` delivers **~90% accuracy** — sufficient for Claude-based downstream scoring.

---

## Why `base/int8`?

```
tiny:   Fast but too many transcription errors → degrades scoring quality
base:   Optimal speed/accuracy trade-off for async interview processing
small:  2.5× slower, ~3% WER improvement — not worth the latency on Railway CPU
medium: >1× RTF → slower than real-time on Railway CPU; unacceptable latency
large:  OOM on Railway standard-1x tier
```

A 2-minute interview answer takes **~26 seconds** to transcribe with `base/int8`.  
With 4 questions per interview, total transcription time ≈ **~2 minutes** (sequential, pg-boss queued).

---

## Implementation

```python
# workers/transcriber/transcriber.py
from faster_whisper import WhisperModel

# Loaded once at module import (not per-request) — stays warm in memory
model = WhisperModel("base", device="cpu", compute_type="int8")

def transcribe(audio_path: str) -> str:
    segments, info = model.transcribe(audio_path, beam_size=5)
    return " ".join(segment.text for segment in segments)
```

**Key optimisations:**
- Model is loaded **once at module import** — not per request. FastAPI keeps it warm between calls.
- Model is **pre-downloaded at Docker build time** via `RUN python -c "WhisperModel('base', ...)"` — zero cold-start download penalty on Railway.
- Audio is extracted to **16kHz mono WAV** by ffmpeg before transcription — Whisper's native input format, no conversion overhead.
- `compute_type="int8"` uses 4-bit integer quantization, halving memory vs float16 with negligible accuracy loss.

---

## Model Pre-Download at Build Time

```dockerfile
# workers/transcriber/Dockerfile
# Pre-download the Whisper 'base' model so cold starts are instant
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"
```

This bakes ~150MB into the Docker image. Railway pulls the image from its registry — the model is available immediately on container start with no network call.
