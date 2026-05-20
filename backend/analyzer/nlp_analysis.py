import re
import nltk
from collections import Counter

# Download required NLTK data on first run
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find("averaged_perceptron_tagger")
except LookupError:
    nltk.download("averaged_perceptron_tagger", quiet=True)


# ── Filler words list ─────────────────────────────────────────────────────────
FILLER_WORDS = {
    "um", "uh", "umm", "uhh", "hmm",
    "like", "basically", "literally", "actually",
    "you know", "you see", "i mean", "i guess", "i think",
    "kind of", "sort of", "right", "okay so", "so yeah",
    "anyway", "whatever",
}

# Single-word fillers for quick matching
SINGLE_FILLERS = {w for w in FILLER_WORDS if " " not in w}
# Multi-word fillers
PHRASE_FILLERS = {w for w in FILLER_WORDS if " " in w}


# ── Weak / hedging language ───────────────────────────────────────────────────
WEAK_PHRASES = [
    r"\bi think\b", r"\bmaybe\b", r"\bperhaps\b", r"\bpossibly\b",
    r"\bi'm not sure\b", r"\bkind of\b", r"\bsort of\b", r"\bsomewhat\b",
    r"\bi guess\b", r"\bprobably\b", r"\bmight be\b", r"\bcould be\b",
    r"\bi suppose\b", r"\bif that makes sense\b",
]

# Strong / confident language patterns
STRONG_PHRASES = [
    r"\bwe will\b", r"\bi will\b", r"\bi have\b", r"\bwe have\b",
    r"\bthe result\b", r"\bthe key\b", r"\bthis shows\b", r"\bthis proves\b",
    r"\bi achieved\b", r"\bwe achieved\b", r"\bthe solution\b",
    r"\bmy experience\b", r"\bi built\b", r"\bi led\b", r"\bi created\b",
]


def analyze_text(text: str) -> dict:
    """
    Full text-based analysis of speech transcript.
    """
    text_lower = text.lower()
    words = text.split()
    word_count = len(words)

    filler_metrics = _detect_fillers(text_lower, words)
    confidence_metrics = _analyze_confidence_language(text_lower)
    clarity_metrics = _analyze_clarity(text, words)
    vocab_metrics = _analyze_vocabulary(words)

    return {
        "word_count": word_count,
        "fillers": filler_metrics,
        "confidence": confidence_metrics,
        "clarity": clarity_metrics,
        "vocabulary": vocab_metrics,
    }


def _detect_fillers(text_lower: str, words: list) -> dict:
    """Detect and count filler words in transcript."""
    words_lower = [w.strip(".,!?;:'\"").lower() for w in words]

    single_matches = [w for w in words_lower if w in SINGLE_FILLERS]
    single_count = len(single_matches)

    # Phrase filler detection
    phrase_count = 0
    phrase_matches = []
    for phrase in PHRASE_FILLERS:
        occurrences = len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))
        phrase_count += occurrences
        if occurrences > 0:
            phrase_matches.append({"phrase": phrase, "count": occurrences})

    total_fillers = single_count + phrase_count

    # Build highlighted word list (each word flagged if filler)
    highlighted = []
    for w in words:
        clean = w.strip(".,!?;:'\"").lower()
        highlighted.append({"word": w, "is_filler": clean in SINGLE_FILLERS})

    # Top filler words
    filler_freq = Counter(w for w in words_lower if w in SINGLE_FILLERS)
    top_fillers = [{"word": w, "count": c} for w, c in filler_freq.most_common(5)]

    return {
        "total_count": total_fillers,
        "single_word_count": single_count,
        "phrase_count": phrase_count,
        "top_fillers": top_fillers,
        "highlighted_words": highlighted,
    }


def _analyze_confidence_language(text_lower: str) -> dict:
    """Detect weak vs strong language patterns."""
    weak_hits = []
    for pattern in WEAK_PHRASES:
        matches = re.findall(pattern, text_lower)
        weak_hits.extend(matches)

    strong_hits = []
    for pattern in STRONG_PHRASES:
        matches = re.findall(pattern, text_lower)
        strong_hits.extend(matches)

    weak_count = len(weak_hits)
    strong_count = len(strong_hits)
    total = weak_count + strong_count

    # Ratio: 0 = all weak, 1 = all strong
    confidence_ratio = strong_count / total if total > 0 else 0.5

    return {
        "weak_language_count": weak_count,
        "strong_language_count": strong_count,
        "confidence_ratio": round(confidence_ratio, 3),
        "weak_examples": list(set(weak_hits))[:5],
        "strong_examples": list(set(strong_hits))[:5],
    }


def _analyze_clarity(text: str, words: list) -> dict:
    """Analyze sentence structure and clarity."""
    try:
        sentences = nltk.sent_tokenize(text)
    except Exception:
        sentences = text.split(".")
        sentences = [s.strip() for s in sentences if s.strip()]

    sentence_count = len(sentences)
    avg_sentence_length = len(words) / sentence_count if sentence_count > 0 else len(words)

    # Passive voice — simple heuristic: "was/were/is/are + past participle"
    passive_pattern = r'\b(was|were|is|are|been|be|being)\s+\w+ed\b'
    passive_count = len(re.findall(passive_pattern, text.lower()))

    # Repetitive sentence starts
    starts = [s.strip().split()[0].lower() if s.strip() else "" for s in sentences]
    start_freq = Counter(starts)
    repetitive_starts = {w: c for w, c in start_freq.items() if c > 2 and w}

    return {
        "sentence_count": sentence_count,
        "avg_sentence_length_words": round(avg_sentence_length, 1),
        "passive_voice_count": passive_count,
        "repetitive_sentence_starts": repetitive_starts,
    }


def _analyze_vocabulary(words: list) -> dict:
    """Measure vocabulary richness using Type-Token Ratio."""
    if not words:
        return {"unique_words": 0, "total_words": 0, "ttr": 0.0}

    cleaned = [w.strip(".,!?;:'\"").lower() for w in words if w.strip()]
    unique = set(cleaned)

    # TTR: ratio of unique words to total words
    # High TTR = rich vocabulary, low TTR = repetitive
    ttr = len(unique) / len(cleaned) if cleaned else 0.0

    # Most repeated content words (excluding common stopwords)
    stopwords = {"the","a","an","and","or","but","in","on","at","to","for",
                 "of","with","is","was","are","were","i","you","he","she","it",
                 "we","they","this","that","these","those","my","your","our"}
    content_words = [w for w in cleaned if w not in stopwords and len(w) > 2]
    freq = Counter(content_words)
    most_repeated = [{"word": w, "count": c} for w, c in freq.most_common(5)]

    return {
        "unique_words": len(unique),
        "total_words": len(cleaned),
        "type_token_ratio": round(ttr, 3),
        "most_repeated_words": most_repeated,
    }
