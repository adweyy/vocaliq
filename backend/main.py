from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os, shutil

from analyzer.transcriber import transcribe_audio
from analyzer.audio_analysis import analyze_audio
from analyzer.nlp_analysis import analyze_text
from analyzer.scorer import compute_scores
from analyzer.pdf_report import generate_pdf

app = FastAPI(title="VocalIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "VocalIQ backend running"}


@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    context: str = Form(default="presentation"),
    topic: str = Form(default=""),
):
    # Save uploaded audio to a temp file
    suffix = os.path.splitext(audio.filename)[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        # --- Step 1: Transcribe ---
        transcript_data = transcribe_audio(tmp_path)

        # --- Step 2: Audio-level analysis ---
        audio_metrics = analyze_audio(tmp_path, transcript_data["duration"])

        # --- Step 3: Text-level analysis ---
        text_metrics = analyze_text(transcript_data["text"])

        # --- Step 4: Compute weighted scores ---
        scores = compute_scores(audio_metrics, text_metrics)

        return {
            "transcript": transcript_data["text"],
            "duration": transcript_data["duration"],
            "word_count": transcript_data["word_count"],
            "audio_metrics": audio_metrics,
            "text_metrics": text_metrics,
            "scores": scores,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        os.unlink(tmp_path)


@app.post("/generate-pdf")
async def pdf(data: dict):
    try:
        pdf_bytes = generate_pdf(data)
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=vocaliq_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
