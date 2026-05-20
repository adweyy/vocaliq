# VocalIQ — AI Speech Coach

<<<<<<< HEAD
An AI-powered communication coach that records your speech, transcribes it, and scores it across 8 parameters: pace, pause quality, volume consistency, pitch variation, filler word control, confidence language, clarity, and vocabulary richness.

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Tailwind + Vite |
| Backend | FastAPI (Python) |
| Transcription | OpenAI Whisper (runs locally, free) |
| Audio analysis | librosa |
| Text analysis | NLTK |
| PDF reports | reportlab |
| Auth + DB (Phase 2) | Supabase |

---

## Setup — Backend

### 1. Create a virtual environment
```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

> **Note:** Installing `openai-whisper` will also download PyTorch. This may take a few minutes.

### 3. Download NLTK data (first time only)
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"
```

### 4. Run the backend
```bash
uvicorn main:app --reload --port 8000
```

The backend will be at `http://localhost:8000`

> **Note:** The first request will download the Whisper `small` model (~461MB). This happens once and is cached.

---

## Setup — Frontend

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Run the frontend
```bash
npm run dev
```

The app will be at `http://localhost:5173`

---

## How It Works

```
User records audio in browser
        ↓
MediaRecorder API captures audio as WebM blob
        ↓
Frontend sends blob to FastAPI backend (/analyze)
        ↓
Whisper transcribes audio → transcript + word timestamps
        ↓
librosa analyzes audio signal → pace, pauses, volume, pitch
        ↓
NLTK + regex → filler words, confidence language, clarity, vocabulary
        ↓
Scorer combines all metrics → 8 sub-scores + overall score + tips
        ↓
Frontend renders dashboard: radar chart, bars, highlighted transcript
        ↓
User downloads PDF report via reportlab
```

---

## Scoring Parameters

| Parameter | Weight | How it's measured |
|---|---|---|
| Pace | 15% | Words per minute (ideal: 130-160 WPM) |
| Pause quality | 10% | Pause frequency and duration via RMS energy |
| Volume consistency | 10% | Coefficient of variation of RMS energy |
| Pitch variation | 10% | Std deviation of F0 via pyin algorithm |
| Filler control | 15% | Filler count per minute (ideal: < 2/min) |
| Confidence language | 15% | Strong vs weak/hedging phrase ratio |
| Clarity | 15% | Sentence length, passive voice, repetitive starts |
| Vocabulary | 10% | Type-Token Ratio |

---

## Phase Roadmap

- **Phase 1 (current):** Core pipeline — record → analyze → results → PDF
- **Phase 2:** Supabase auth + session history + progress dashboard
- **Phase 3:** Session comparison + streak tracking
- **Phase 4:** Deploy to Vercel (frontend) + Render (backend)

---

## Project Structure

```
vocaliq/
├── backend/
│   ├── main.py                 # FastAPI routes
│   ├── requirements.txt
│   └── analyzer/
│       ├── transcriber.py      # Whisper transcription
│       ├── audio_analysis.py   # librosa acoustic analysis
│       ├── nlp_analysis.py     # Text/NLP analysis
│       ├── scorer.py           # Weighted scoring engine
│       └── pdf_report.py       # PDF generation
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Prepare.jsx     # Room check + context + countdown
        │   ├── Record.jsx      # Live recording + waveform
        │   ├── Processing.jsx  # Upload + analysis progress
        │   ├── Results.jsx     # Full dashboard
        │   └── Dashboard.jsx   # Session history (Phase 2)
        └── context/
            └── SessionContext.jsx
```

---

Built with ❤️ as part of BTECH AIML coursework — bridging AI and marketing.
=======
VocalIQ is a full-stack AI application that records your speech and analyzes it 
across 8 parameters using a real ML pipeline — not just an API call.

Record a pitch, interview answer, or presentation. VocalIQ transcribes it with 
OpenAI Whisper, runs acoustic analysis with librosa, scores your language 
confidence with NLP, and generates a detailed coaching report with a 
downloadable PDF.

Built as a portfolio project at the intersection of AI/ML and communication 
— because the best engineers aren't just the ones who build the best things, 
they're the ones who can explain them.

## Live Demo
[Link here once deployed]

## Tech Stack
- **Frontend** — React, Tailwind CSS, Recharts
- **Backend** — FastAPI, Python
- **Transcription** — OpenAI Whisper (runs locally, free)
- **Audio Analysis** — librosa (pace, pitch, pauses, volume)
- **NLP** — NLTK (filler detection, confidence language, clarity)
- **PDF Reports** — reportlab
- **Auth + History** — Supabase (Phase 2)
>>>>>>> fd81f7190040e21bd9b8ebeb94ff907a9c1b9fd9
