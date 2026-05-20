"""
Scorer — converts raw audio + text metrics into weighted 0-100 scores.

Weights:
  Pace                15%
  Pause quality       10%
  Volume consistency  10%
  Pitch variation     10%
  Filler frequency    15%
  Confidence language 15%
  Clarity             15%
  Vocabulary richness 10%
"""


def compute_scores(audio_metrics: dict, text_metrics: dict) -> dict:
    word_count = text_metrics.get("word_count", 0)
    duration = audio_metrics["pace"]["duration_seconds"]

    pace_score = _score_pace(word_count, duration)
    pause_score = _score_pauses(audio_metrics["pauses"], duration)
    volume_score = _score_volume(audio_metrics["volume"])
    pitch_score = _score_pitch(audio_metrics["pitch"])
    filler_score = _score_fillers(text_metrics["fillers"], duration)
    confidence_score = _score_confidence(text_metrics["confidence"])
    clarity_score = _score_clarity(text_metrics["clarity"])
    vocab_score = _score_vocabulary(text_metrics["vocabulary"])

    # Weighted overall score
    overall = round(
        pace_score * 0.15 +
        pause_score * 0.10 +
        volume_score * 0.10 +
        pitch_score * 0.10 +
        filler_score * 0.15 +
        confidence_score * 0.15 +
        clarity_score * 0.15 +
        vocab_score * 0.10,
        1,
    )

    sub_scores = {
        "pace": round(pace_score, 1),
        "pause_quality": round(pause_score, 1),
        "volume_consistency": round(volume_score, 1),
        "pitch_variation": round(pitch_score, 1),
        "filler_control": round(filler_score, 1),
        "confidence_language": round(confidence_score, 1),
        "clarity": round(clarity_score, 1),
        "vocabulary": round(vocab_score, 1),
    }

    tips = _generate_tips(sub_scores, audio_metrics, text_metrics, word_count, duration)

    return {
        "overall": overall,
        "sub_scores": sub_scores,
        "wpm": round((word_count / duration) * 60, 1) if duration > 0 else 0,
        "tips": tips,
    }


# ── Individual scorers ─────────────────────────────────────────────────────────

def _score_pace(word_count: int, duration: float) -> float:
    """Ideal: 130-160 WPM for presentations, 110-140 for interviews."""
    if duration <= 0:
        return 50.0
    wpm = (word_count / duration) * 60

    if 130 <= wpm <= 160:
        return 100.0
    elif 110 <= wpm < 130 or 160 < wpm <= 180:
        return 80.0
    elif 90 <= wpm < 110 or 180 < wpm <= 200:
        return 60.0
    elif 70 <= wpm < 90 or 200 < wpm <= 220:
        return 40.0
    else:
        return 20.0


def _score_pauses(pause_data: dict, duration: float) -> float:
    """
    Good: strategic pauses (0.5-2s), roughly 1 per 30 seconds of speech.
    Bad: too many long pauses (nervous) or no pauses at all (rushed).
    """
    count = pause_data.get("count", 0)
    avg_pause = pause_data.get("average_pause_seconds", 0.0)
    total_pause_pct = pause_data.get("total_pause_seconds", 0) / max(duration, 1)

    score = 70.0  # baseline

    # Ideal: 1 pause per ~20-30 seconds, average 0.5-1.5s
    if count == 0:
        score -= 20  # no pauses = rushed
    elif avg_pause > 3.0:
        score -= 25  # too long = nervous/lost
    elif 0.5 <= avg_pause <= 1.5:
        score += 20  # good strategic pauses
    elif avg_pause <= 0.5:
        score += 5

    # If more than 30% of speech is silence, too many pauses
    if total_pause_pct > 0.3:
        score -= 15
    elif total_pause_pct > 0.2:
        score -= 5

    return max(0.0, min(100.0, score))


def _score_volume(volume_data: dict) -> float:
    """
    Low CV = consistent volume = good.
    Trailing off detected = penalty.
    """
    cv = volume_data.get("coefficient_of_variation", 1.0)
    trailing = volume_data.get("trailing_off_detected", False)

    # CV scoring: lower is better (more consistent)
    if cv < 0.2:
        score = 100.0
    elif cv < 0.35:
        score = 80.0
    elif cv < 0.5:
        score = 60.0
    elif cv < 0.7:
        score = 40.0
    else:
        score = 25.0

    if trailing:
        score -= 15.0

    return max(0.0, min(100.0, score))


def _score_pitch(pitch_data: dict) -> float:
    """
    Good: moderate pitch variation (std 30-80 Hz).
    Monotone (std < 25): penalty.
    Excessive variation (std > 100): slight penalty.
    """
    std = pitch_data.get("std_pitch_hz", 0.0)
    monotone = pitch_data.get("monotone_detected", True)

    if monotone or std < 15:
        return 20.0
    elif 15 <= std < 25:
        return 45.0
    elif 25 <= std < 50:
        return 75.0
    elif 50 <= std <= 80:
        return 100.0
    elif 80 < std <= 100:
        return 80.0
    else:
        return 60.0


def _score_fillers(filler_data: dict, duration: float) -> float:
    """
    Industry standard: < 2 fillers/min = good.
    2-5/min = acceptable. > 5/min = poor.
    """
    total = filler_data.get("total_count", 0)
    minutes = max(duration / 60, 0.1)
    per_minute = total / minutes

    if per_minute < 1:
        return 100.0
    elif per_minute < 2:
        return 85.0
    elif per_minute < 4:
        return 65.0
    elif per_minute < 6:
        return 45.0
    elif per_minute < 10:
        return 25.0
    else:
        return 10.0


def _score_confidence(conf_data: dict) -> float:
    """
    Confidence ratio 0-1 (1 = all strong language).
    """
    ratio = conf_data.get("confidence_ratio", 0.5)
    weak = conf_data.get("weak_language_count", 0)

    score = ratio * 100

    # Extra penalty for many weak phrases
    if weak > 10:
        score -= 15
    elif weak > 5:
        score -= 8

    return max(0.0, min(100.0, score))


def _score_clarity(clarity_data: dict) -> float:
    """
    Ideal avg sentence length: 10-20 words.
    Passive voice and repetitive starts reduce score.
    """
    avg_len = clarity_data.get("avg_sentence_length_words", 15)
    passive = clarity_data.get("passive_voice_count", 0)
    repetitive = len(clarity_data.get("repetitive_sentence_starts", {}))

    if 10 <= avg_len <= 20:
        score = 100.0
    elif 7 <= avg_len < 10 or 20 < avg_len <= 25:
        score = 75.0
    elif 5 <= avg_len < 7 or 25 < avg_len <= 30:
        score = 55.0
    else:
        score = 35.0

    score -= min(passive * 5, 20)       # max -20 for passive voice
    score -= min(repetitive * 10, 20)   # max -20 for repetitive starts

    return max(0.0, min(100.0, score))


def _score_vocabulary(vocab_data: dict) -> float:
    """
    Type-Token Ratio: ideal 0.4-0.7 for spoken speech.
    """
    ttr = vocab_data.get("type_token_ratio", 0.5)

    if ttr >= 0.5:
        return 100.0
    elif ttr >= 0.4:
        return 80.0
    elif ttr >= 0.3:
        return 60.0
    elif ttr >= 0.2:
        return 40.0
    else:
        return 20.0


# ── Tip generator ──────────────────────────────────────────────────────────────

def _generate_tips(sub_scores, audio_metrics, text_metrics, word_count, duration):
    tips = []
    wpm = (word_count / duration * 60) if duration > 0 else 0

    if sub_scores["pace"] < 70:
        if wpm > 160:
            tips.append({
                "category": "Pace",
                "icon": "⚡",
                "message": f"You spoke at {wpm:.0f} WPM — a bit fast. Aim for 130-160 WPM. Practice with deliberate pauses between points.",
            })
        else:
            tips.append({
                "category": "Pace",
                "icon": "🐢",
                "message": f"You spoke at {wpm:.0f} WPM — slightly slow. Try to be more energetic and maintain momentum.",
            })

    if sub_scores["filler_control"] < 70:
        top = text_metrics["fillers"].get("top_fillers", [])
        filler_str = ", ".join([f'"{f["word"]}" ({f["count"]}x)' for f in top[:3]])
        tips.append({
            "category": "Filler Words",
            "icon": "🗣️",
            "message": f"Your most used fillers: {filler_str}. Replace them with a 0.5s silent pause — silence sounds more confident than 'um'.",
        })

    if sub_scores["confidence_language"] < 70:
        weak_ex = text_metrics["confidence"].get("weak_examples", [])
        if weak_ex:
            tips.append({
                "category": "Confidence",
                "icon": "💪",
                "message": f"Phrases like '{weak_ex[0]}' undermine your authority. Replace hedging language with direct, assertive statements.",
            })

    if sub_scores["pitch_variation"] < 60:
        tips.append({
            "category": "Pitch",
            "icon": "🎵",
            "message": "Your delivery sounds monotone. Vary your pitch at key points — raise it for excitement, lower it for emphasis.",
        })

    if sub_scores["volume_consistency"] < 70:
        if audio_metrics["volume"].get("trailing_off_detected"):
            tips.append({
                "category": "Volume",
                "icon": "🔊",
                "message": "You tend to trail off at the end of sentences. Maintain your volume through the full sentence — it projects confidence.",
            })

    if sub_scores["pause_quality"] < 60:
        tips.append({
            "category": "Pauses",
            "icon": "⏸️",
            "message": "Work on strategic pauses after key points. A 1-2 second pause gives your listener time to absorb what you said.",
        })

    if sub_scores["clarity"] < 70:
        tips.append({
            "category": "Clarity",
            "icon": "💡",
            "message": "Keep sentences shorter and use active voice. Say 'I built X' instead of 'X was built by me'.",
        })

    if not tips:
        tips.append({
            "category": "Overall",
            "icon": "🌟",
            "message": "Strong performance across the board. Focus on consistency and try to push your filler words even lower.",
        })

    return tips
