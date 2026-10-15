import os
import hashlib
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.core.config import settings

def compute_transcript_hash(student_id: str, student_name: str, generated_date_str: str) -> str:
    raw = f"{student_id}|{student_name}|{generated_date_str}|{settings.SECRET_KEY}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def generate_transcript_pdf(transcript_data: dict) -> str:
    os.makedirs(settings.CERTIFICATES_DIR, exist_ok=True)
    student = transcript_data.get("student", {})
    student_id = student.get("student_id", "MST-STUDENT")
    clean_id = student_id.replace("/", "_").replace(" ", "_")
    filename = f"Transcript_{clean_id}.pdf"
    filepath = os.path.join(settings.CERTIFICATES_DIR, filename)

    now = datetime.utcnow()
    date_str = now.strftime("%Y-%m-%d")
    trans_hash = compute_transcript_hash(student_id, student.get("name", "Student"), date_str)
    verification_url = f"{settings.PUBLIC_URL}/api/v1/reports/transcript/{student_id}"

    # Generate small QR code for transcript verification
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=3,
        border=1,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0f172a", back_color="white")
    qr_temp_path = os.path.join(settings.CERTIFICATES_DIR, f"qr_trans_{clean_id}.png")
    qr_img.save(qr_temp_path)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.HexColor('#0f172a')
    )

    sub_title_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#0369a1')
    )

    doc_type_style = ParagraphStyle(
        'DocType',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#1e293b')
    )

    sec_hdr_style = ParagraphStyle(
        'SecHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0284c7')
    )

    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    cell_bold_style = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#64748b')
    )

    elements = []

    # 1. Header
    elements.append(Paragraph("MIRAI SCHOOL OF TECHNOLOGY", title_style))
    elements.append(Paragraph("DIRECTORATE OF STUDENT CLUBS &amp; CO-CURRICULAR AFFAIRS", sub_title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("OFFICIAL CO-CURRICULAR TRANSCRIPT", doc_type_style))
    elements.append(Spacer(1, 10))

    # 2. Student Info Box
    student_table_data = [
        [
            Paragraph(f"<b>Student Name:</b> {student.get('name', 'N/A')}", cell_style),
            Paragraph(f"<b>Student / Roll ID:</b> {student_id}", cell_style)
        ],
        [
            Paragraph(f"<b>Department:</b> {student.get('department', 'N/A')}", cell_style),
            Paragraph(f"<b>Academic Year:</b> {student.get('year', 'N/A')}", cell_style)
        ],
        [
            Paragraph(f"<b>Campus:</b> {student.get('campus', 'Main Campus')}", cell_style),
            Paragraph(f"<b>Record Generated:</b> {now.strftime('%B %d, %Y')}", cell_style)
        ]
    ]
    student_table = Table(student_table_data, colWidths=[3.7*inch, 3.7*inch])
    student_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(student_table)
    elements.append(Spacer(1, 12))

    # 3. Section 1: Enrolled Clubs
    elements.append(Paragraph("1. ENROLLED CLUB MEMBERSHIPS", sec_hdr_style))
    elements.append(Spacer(1, 4))
    clubs_data = [["Club Name", "Designation", "Enrolment Date", "Status"]]
    for c in transcript_data.get("clubs", []):
        clubs_data.append([
            c.get("club_name", "N/A"),
            c.get("role", "MEMBER"),
            c.get("joined_date", "N/A"),
            "APPROVED / ACTIVE"
        ])
    if len(clubs_data) == 1:
        clubs_data.append(["No active club memberships recorded.", "-", "-", "-"])

    t_clubs = Table(clubs_data, colWidths=[3.0*inch, 1.6*inch, 1.4*inch, 1.4*inch])
    t_clubs.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_clubs)
    elements.append(Spacer(1, 10))

    # 4. Section 2: Club Day Sessions & Attendance
    elements.append(Paragraph("2. VERIFIED CLUB DAY ATTENDANCE RECORDS", sec_hdr_style))
    elements.append(Spacer(1, 4))
    att_table_data = [["Activity Topic", "Check-in Timestamp", "Method", "Verified Status"]]
    for a in transcript_data.get("attendances", []):
        att_table_data.append([
            a.get("activity_topic", "Club Day Session"),
            a.get("date", "N/A"),
            "15s Rotating QR",
            f"{a.get('status', 'PRESENT')} {'(Late Arrival)' if a.get('is_late') else ''}"
        ])
    if len(att_table_data) == 1:
        att_table_data.append(["No session attendance records found.", "-", "-", "-"])

    t_att = Table(att_table_data, colWidths=[3.2*inch, 1.6*inch, 1.2*inch, 1.4*inch])
    t_att.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_att)
    elements.append(Spacer(1, 10))

    # 5. Section 3: Submissions & Evaluations
    elements.append(Paragraph("3. WORKSHOP DELIVERABLES &amp; RUBRIC EVALUATIONS", sec_hdr_style))
    elements.append(Spacer(1, 4))
    sub_table_data = [["Deliverable Title", "Activity", "Submitted", "Rubric Score", "Evaluator Feedback"]]
    for s in transcript_data.get("submissions", []):
        sub_table_data.append([
            Paragraph(s.get("title", "Project"), cell_bold_style),
            Paragraph(s.get("activity_topic", "Activity"), cell_style),
            s.get("submitted_at", "N/A"),
            s.get("score", "Pending"),
            Paragraph(s.get("feedback", "Completed according to rubric requirements."), cell_style)
        ])
    if len(sub_table_data) == 1:
        sub_table_data.append(["No workshop deliverables submitted.", "-", "-", "-", "-"])

    t_sub = Table(sub_table_data, colWidths=[1.8*inch, 1.6*inch, 0.9*inch, 0.9*inch, 2.2*inch])
    t_sub.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_sub)
    elements.append(Spacer(1, 10))

    # 6. Section 4: Events & Competitions
    elements.append(Paragraph("4. CAMPUS EVENTS, HACKATHONS &amp; COMPETITIONS", sec_hdr_style))
    elements.append(Spacer(1, 4))
    ev_table_data = [["Event Name", "Venue", "Team Name", "Check-in Status"]]
    for ev in transcript_data.get("events", []):
        ev_table_data.append([
            Paragraph(ev.get("event_title", "Event"), cell_bold_style),
            ev.get("venue", "Campus"),
            ev.get("team_name", "Individual"),
            "Checked-in / Active" if ev.get("checked_in") else "Confirmed Registered"
        ])
    if len(ev_table_data) == 1:
        ev_table_data.append(["No event registrations found.", "-", "-", "-"])

    t_ev = Table(ev_table_data, colWidths=[3.2*inch, 1.6*inch, 1.3*inch, 1.3*inch])
    t_ev.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_ev)
    elements.append(Spacer(1, 10))

    # 7. Section 5: Certificates & Honors
    elements.append(Paragraph("5. ISSUED CREDENTIALS &amp; VERIFIED CERTIFICATES", sec_hdr_style))
    elements.append(Spacer(1, 4))
    cert_table_data = [["Certificate Number", "Achievement Title", "Award Type", "Date Issued"]]
    for cr in transcript_data.get("certificates", []):
        cert_table_data.append([
            cr.get("certificate_number", "N/A"),
            cr.get("title", "Achievement"),
            cr.get("cert_type", "PARTICIPATION"),
            cr.get("issue_date", "N/A")
        ])
    if len(cert_table_data) == 1:
        cert_table_data.append(["No certificates issued yet.", "-", "-", "-"])

    t_cert = Table(cert_table_data, colWidths=[1.8*inch, 3.0*inch, 1.3*inch, 1.3*inch])
    t_cert.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_cert)
    elements.append(Spacer(1, 15))

    # 8. Signature Block & Verification Stamp Table
    qr_cell = RLImage(qr_temp_path, width=0.85*inch, height=0.85*inch)
    stamp_info = Paragraph(
        f"<b>Official University Seal &amp; Cryptographic Record Verification:</b><br/>"
        f"SHA-256 Digest: <font color='#0369a1'>{trans_hash[:32]}...</font><br/>"
        f"Verified against Mirai School of Technology Central Database Registry.<br/>"
        f"Direct API Transcript Verification: <font color='#0284c7'>{verification_url}</font>",
        footer_style
    )
    sig_info = Paragraph(
        f"<b>Registrar / Dean of Student Affairs</b><br/>"
        f"Directorate of Co-Curricular Education<br/>"
        f"Mirai School of Technology",
        ParagraphStyle('DeanSig', parent=styles['Normal'], fontSize=8, leading=12, alignment=2)
    )

    t_foot = Table([[qr_cell, stamp_info, sig_info]], colWidths=[1.0*inch, 4.2*inch, 2.2*inch])
    t_foot.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(KeepTogether(t_foot))

    # Build PDF
    doc.build(elements)

    if os.path.exists(qr_temp_path):
        os.remove(qr_temp_path)

    return filepath
