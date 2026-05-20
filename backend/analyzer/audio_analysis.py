import librosa
import numpy as np


def analyze_audio(file_path: str, duration: float) -> dict:
    """
    Analyze acoustic properties of the audio file.
    Returns pace, pause, volume, pitch, and energy metrics.
    """
    # Load audio — librosa converts everything to mono float32
    y, sr = librosa.load(file_path, sr=16000, mono=True)

    pace_metrics = _analyze_pace(duration)
    pause_metrics = _analyze_pauses(y, sr)
    volume_metrics = _analyze_volume(y, sr)
    pitch_metrics = _analyze_pitch(y, sr)

    return {
        "pace": pace_metrics,
        "pauses": pause_metrics,
        "volume": volume_metrics,
        "pitch": pitch_metrics,
    }


def _analyze_pace(duration: float) -> dict:
    """
    Pace is computed from transcript word count + duration in the scorer.
    Here we return the raw duration for the scorer to use.
    """
    return {
        "duration_seconds": round(duration, 2),
        # WPM will be computed in scorer using word_count + duration
    }


def _analyze_pauses(y: np.ndarray, sr: int) -> dict:
    """
    Detect pauses using RMS energy threshold.
    A pause is a silent region lasting > 0.4 seconds.
    """
    frame_length = 1024
    hop_length = 256

    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)

    # Threshold: below 5% of max RMS = silence
    silence_threshold = 0.05 * np.max(rms) if np.max(rms) > 0 else 0.01
    is_silent = rms < silence_threshold

    # Detect contiguous silent regions
    pauses = []
    in_pause = False
    pause_start = 0.0

    for i, silent in enumerate(is_silent):
        if silent and not in_pause:
            in_pause = True
            pause_start = times[i]
        elif not silent and in_pause:
            in_pause = False
            pause_duration = times[i] - pause_start
            if pause_duration >= 0.4:   # only count pauses >= 0.4 seconds
                pauses.append(round(pause_duration, 2))

    total_pause_time = sum(pauses)
    avg_pause = round(np.mean(pauses), 2) if pauses else 0.0

    return {
        "count": len(pauses),
        "total_pause_seconds": round(total_pause_time, 2),
        "average_pause_seconds": avg_pause,
        "pause_durations": pauses[:20],   # cap at 20 for response size
    }


def _analyze_volume(y: np.ndarray, sr: int) -> dict:
    """
    Analyze volume consistency.
    Trailing off = decreasing RMS at end of phrases.
    High variance = inconsistent volume.
    """
    frame_length = 2048
    hop_length = 512

    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]

    # Normalize to 0-1
    if np.max(rms) > 0:
        rms_norm = rms / np.max(rms)
    else:
        rms_norm = rms

    # Remove silent frames from stats
    active_frames = rms_norm[rms_norm > 0.05]

    mean_volume = float(np.mean(active_frames)) if len(active_frames) > 0 else 0.0
    std_volume = float(np.std(active_frames)) if len(active_frames) > 0 else 0.0

    # Coefficient of variation — lower = more consistent
    cv = std_volume / mean_volume if mean_volume > 0 else 1.0

    # Check for trailing off: compare first half vs second half energy
    mid = len(active_frames) // 2
    first_half_mean = float(np.mean(active_frames[:mid])) if mid > 0 else 0.5
    second_half_mean = float(np.mean(active_frames[mid:])) if mid > 0 else 0.5
    trailing_off = (first_half_mean - second_half_mean) > 0.15

    return {
        "mean_volume_normalized": round(mean_volume, 3),
        "std_volume": round(std_volume, 3),
        "coefficient_of_variation": round(cv, 3),
        "trailing_off_detected": trailing_off,
    }


def _analyze_pitch(y: np.ndarray, sr: int) -> dict:
    """
    Analyze pitch variation using YIN algorithm.
    Monotone speech = very low std pitch.
    Good variation = moderate std with controlled mean.
    """
    # Use pyin for more robust pitch detection
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),   # ~65 Hz — lower limit of voice
        fmax=librosa.note_to_hz("C7"),   # ~2093 Hz — upper limit of voice
        sr=sr,
    )

    # Only use voiced frames
    voiced_f0 = f0[voiced_flag] if voiced_flag is not None else f0
    voiced_f0 = voiced_f0[~np.isnan(voiced_f0)]

    if len(voiced_f0) == 0:
        return {
            "mean_pitch_hz": 0.0,
            "std_pitch_hz": 0.0,
            "pitch_range_hz": 0.0,
            "monotone_detected": True,
        }

    mean_pitch = float(np.mean(voiced_f0))
    std_pitch = float(np.std(voiced_f0))
    pitch_range = float(np.max(voiced_f0) - np.min(voiced_f0))

    # Monotone: std below 25 Hz is considered monotone
    monotone = std_pitch < 25.0

    return {
        "mean_pitch_hz": round(mean_pitch, 2),
        "std_pitch_hz": round(std_pitch, 2),
        "pitch_range_hz": round(pitch_range, 2),
        "monotone_detected": monotone,
    }
