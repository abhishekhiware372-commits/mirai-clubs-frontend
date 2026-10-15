import os
import hashlib
import json
import uuid
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.core.config import settings

def compute_certificate_hash(cert_number: str, user_id: str, title: str, cert_type: str, issue_date_str: str) -> str:
    raw = f"{cert_number}|{user_id}|{title}|{cert_type}|{issue_date_str}|{settings.SECRET_KEY}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def generate_certificate_pdf(
    cert_number: str,
    student_name: str,
    student_id: str,
    title: str,
    cert_type: str,
    issuer_name: str,
    issue_date: datetime,
    verification_url: str
) -> str:
    os.makedirs(settings.CERTIFICATES_DIR, exist_ok=True)
    filename = f"{cert_number}.pdf"
    filepath = os.path.join(settings.CERTIFICATES_DIR, filename)

    # 1. Generate QR Code image for the verification URL
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0ea5e9", back_color="white")
    qr_temp_path = os.path.join(settings.CERTIFICATES_DIR, f"qr_{cert_number}.png")
    qr_img.save(qr_temp_path)

    # 2. Build PDF Document in Landscape Mode
    doc = SimpleDocTemplate(
        filepath,
        pagesize=landscape(letter),
        rightMargin=40,
        leftMargin=40,
        topMargin=35,
        bottomMargin=35
    )

    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'CertHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        alignment=1, # Center
        textColor=colors.HexColor('#0f172a')
    )
    
    sub_header_style = ParagraphStyle(
        'CertSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#0284c7')
    )

    badge_style = ParagraphStyle(
        'CertBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=24,
        alignment=1,
        textColor=colors.HexColor('#6366f1')
    )

    recipient_intro = ParagraphStyle(
        'CertIntro',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        alignment=1,
        textColor=colors.HexColor('#475569')
    )

    recipient_name = ParagraphStyle(
        'CertName',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        alignment=1,
        textColor=colors.HexColor('#0369a1')
    )

    details_style = ParagraphStyle(
        'CertDetails',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=18,
        alignment=1,
        textColor=colors.HexColor('#334155')
    )

    footer_meta = ParagraphStyle(
        'CertFooter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )

    elements = []
    
    # Header
    elements.append(Paragraph("MIRAI SCHOOL OF TECHNOLOGY", header_style))
    elements.append(Paragraph("DIRECTORATE OF STUDENT CLUBS &amp; CO-CURRICULAR ACTIVITIES", sub_header_style))
    elements.append(Spacer(1, 15))
    
    # Certificate Type
    badge_text = f"CERTIFICATE OF {cert_type.upper()}"
    elements.append(Paragraph(badge_text, badge_style))
    elements.append(Spacer(1, 12))

    # Recipient
    elements.append(Paragraph("This is proudly presented to", recipient_intro))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<b>{student_name}</b> (ID: {student_id or 'MST-STUDENT'})", recipient_name))
    elements.append(Spacer(1, 10))

    # Activity / Event Achievement
    cert_text = (
        f"for outstanding participation and successful completion of the club initiative<br/>"
        f"<b>\"{title}\"</b><br/>"
        f"demonstrating engineering rigor, innovation, and leadership."
    )
    elements.append(Paragraph(cert_text, details_style))
    elements.append(Spacer(1, 20))

    # Signatures and QR Code Layout Table
    date_str = issue_date.strftime("%B %d, %Y")
    
    sig_cell = Paragraph(
        f"<b>{issuer_name}</b><br/>Faculty Advisor / Directorate<br/>Mirai School of Technology",
        ParagraphStyle('Sig', parent=styles['Normal'], fontSize=10, leading=14, alignment=0)
    )
    
    date_cell = Paragraph(
        f"<b>Date of Issuance:</b><br/>{date_str}<br/><b>Status:</b> Authoritatively Verified",
        ParagraphStyle('Date', parent=styles['Normal'], fontSize=10, leading=14, alignment=0)
    )

    qr_cell = RLImage(qr_temp_path, width=1.1*inch, height=1.1*inch)

    meta_cell = Paragraph(
        f"<b>Certificate ID:</b> {cert_number}<br/>"
        f"<b>Scan QR to Verify authenticity</b><br/>"
        f"<font color='#0284c7'>{verification_url}</font>",
        footer_meta
    )

    sig_table = Table([
        [sig_cell, date_cell, qr_cell, meta_cell]
    ], colWidths=[2.2*inch, 2.0*inch, 1.4*inch, 2.4*inch])
    
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(sig_table)

    # Build PDF
    doc.build(elements)

    # Clean up temp QR file
    if os.path.exists(qr_temp_path):
        os.remove(qr_temp_path)

    return filepath
