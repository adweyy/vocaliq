import whisper
import os

# Load the model once at module level so it's not reloaded on every request.
# "small" is a good balance of accuracy and speed on CPU.
# Switch to "medium" for better accuracy if you have a decent GPU.
_model = None

def get_model():
    global _model
    if _model is None:
        print("[Whisper] Loading model... (first time only)")
        _model = whisper.load_model("small")
    return _model


def transcribe_audio(file_path: str) -> dict:
    """
    Transcribe an audio file using OpenAI Whisper.
    Returns transcript text, duration, and word count.
    """
    model = get_model()

    result = model.transcribe(
        file_path,
        language=None,           # auto-detect language
        task="transcribe",
        word_timestamps=True,    # gives us per-word timing for pause analysis
        fp16=False,              # CPU safe
    )

    text = result["text"].strip()
    duration = result.get("duration", 0.0)

    # If whisper didn't return duration, estimate from segments
    if not duration and result.get("segments"):
        duration = result["segments"][-1]["end"]

    words = text.split()
    word_count = len(words)

    # Extract word-level timestamps for pause detection
    word_timestamps = []
    for segment in result.get("segments", []):
        for word_info in segment.get("words", []):
            word_timestamps.append({
                "word": word_info["word"].strip(),
                "start": word_info["start"],
                "end": word_info["end"],
            })

    return {
        "text": text,
        "duration": round(duration, 2),
        "word_count": word_count,
        "word_timestamps": word_timestamps,
        "language": result.get("language", "en"),
    }
