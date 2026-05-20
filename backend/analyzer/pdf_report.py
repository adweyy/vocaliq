from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime


# Brand colors
PURPLE = colors.HexColor("#7B6EF6")
DARK = colors.HexColor("#1a1a2e")
GREEN = colors.HexColor("#4ECDC4")
RED = colors.HexColor("#FF6B6B")
AMBER = colors.HexColor("#FFD166")
LIGHT_GRAY = colors.HexColor("#f5f5f8")
MID_GRAY = colors.HexColor("#8888aa")


def _score_color(score):
    if score >= 75:
        return GREEN
    elif score >= 50:
        return AMBER
    else:
        return RED


def generate_pdf(data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ─────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", fontSize=24, textColor=PURPLE,
                                  spaceAfter=4, alignment=TA_LEFT, fontName="Helvetica-Bold")
    sub_style = ParagraphStyle("sub", fontSize=11, textColor=MID_GRAY,
                                spaceAfter=2, alignment=TA_LEFT)
    story.append(Paragraph("VocalIQ", title_style))
    story.append(Paragraph("Speech Analysis Report", sub_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PURPLE, spaceAfter=16))

    scores = data.get("scores", {})
    overall = scores.get("overall", 0)
    sub_scores = scores.get("sub_scores", {})
    wpm = scores.get("wpm", 0)
    transcript = data.get("transcript", "")
    duration = data.get("duration", 0)
    tips = scores.get("tips", [])

    # ── Overall score ──────────────────────────────────────────────────────────
    section_style = ParagraphStyle("section", fontSize=13, textColor=DARK,
                                    spaceBefore=12, spaceAfter=8, fontName="Helvetica-Bold")
    story.append(Paragraph("Overall Score", section_style))

    score_color = _score_color(overall)
    overall_data = [[
        Paragraph(f"<font size=36 color='#{score_color.hexval()[2:]}''><b>{overall}</b></font>", styles["Normal"]),
        Paragraph(f"<b>WPM:</b> {wpm}<br/>"
                  f"<b>Duration:</b> {int(duration)}s<br/>"
                  f"<b>Words:</b> {data.get('word_count', 0)}", styles["Normal"]),
    ]]
    overall_table = Table(overall_data, colWidths=["30%", "70%"])
    overall_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), LIGHT_GRAY),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0ee")),
        ("PADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(overall_table)
    story.append(Spacer(1, 12))

    # ── Sub scores ─────────────────────────────────────────────────────────────
    story.append(Paragraph("Detailed Scores", section_style))

    label_map = {
        "pace": "Pace & Speed",
        "pause_quality": "Pause Quality",
        "volume_consistency": "Volume Consistency",
        "pitch_variation": "Pitch Variation",
        "filler_control": "Filler Word Control",
        "confidence_language": "Confidence Language",
        "clarity": "Clarity & Structure",
        "vocabulary": "Vocabulary Richness",
    }

    score_rows = []
    for key, label in label_map.items():
        val = sub_scores.get(key, 0)
        col = _score_color(val)
        score_rows.append([
            Paragraph(label, styles["Normal"]),
            Paragraph(f"<font color='#{col.hexval()[2:]}'><b>{val}/100</b></font>", styles["Normal"]),
        ])

    score_table = Table(score_rows, colWidths=["70%", "30%"])
    score_table.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0ee")),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#e8e8f0")),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 12))

    # ── Coaching tips ──────────────────────────────────────────────────────────
    if tips:
        story.append(Paragraph("Coaching Recommendations", section_style))
        for tip in tips:
            tip_style = ParagraphStyle("tip", fontSize=10, leftIndent=12,
                                        spaceBefore=6, leading=14)
            story.append(Paragraph(
                f"<b>{tip.get('icon', '')} {tip.get('category', '')}</b>: {tip.get('message', '')}",
                tip_style
            ))
        story.append(Spacer(1, 12))

    # ── Transcript ─────────────────────────────────────────────────────────────
    if transcript:
        story.append(Paragraph("Full Transcript", section_style))
        transcript_style = ParagraphStyle("transcript", fontSize=9,
                                           leading=14, textColor=colors.HexColor("#444455"),
                                           backColor=LIGHT_GRAY, borderPadding=10)
        story.append(Paragraph(transcript, transcript_style))

    # ── Footer ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GRAY))
    footer_style = ParagraphStyle("footer", fontSize=8, textColor=MID_GRAY,
                                   alignment=TA_CENTER, spaceBefore=6)
    story.append(Paragraph("Generated by VocalIQ • AI Speech Analysis", footer_style))

    doc.build(story)
    return buffer.getvalue()
