import os
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.entities import Certificate, User, Activity, Event, Notification
from app.schemas.schemas import CertificateCreate, CertificateOut, CertificateVerifyOut
from app.api.deps import get_current_user, require_advisor_or_above
from app.services.certificate_service import (
    generate_certificate_pdf, compute_certificate_hash
)

router = APIRouter()

@router.post("/issue", response_model=CertificateOut)
def issue_certificate(
    cert_in: CertificateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_advisor_or_above)
):
    student = db.query(User).filter(User.id == cert_in.user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Generate unique certificate number
    random_digits = random.randint(10000, 99999)
    cert_number = f"MST-CERT-2026-{random_digits}"
    while db.query(Certificate).filter(Certificate.certificate_number == cert_number).first():
        random_digits = random.randint(10000, 99999)
        cert_number = f"MST-CERT-2026-{random_digits}"

    now = datetime.utcnow()
    date_str = now.strftime("%Y-%m-%d")

    # Cryptographic integrity signature
    verification_hash = compute_certificate_hash(
        cert_number=cert_number,
        user_id=student.id,
        title=cert_in.title,
        cert_type=cert_in.cert_type,
        issue_date_str=date_str
    )

    verification_url = f"{settings.PUBLIC_URL}/verify/{cert_number}"

    # Generate PDF
    pdf_path = generate_certificate_pdf(
        cert_number=cert_number,
        student_name=student.full_name,
        student_id=student.student_id or "MST-STUDENT",
        title=cert_in.title,
        cert_type=cert_in.cert_type,
        issuer_name=current_user.full_name,
        issue_date=now,
        verification_url=verification_url
    )

    certificate = Certificate(
        certificate_number=cert_number,
        user_id=student.id,
        title=cert_in.title,
        cert_type=cert_in.cert_type,
        issued_by=current_user.id,
        activity_id=cert_in.activity_id,
        event_id=cert_in.event_id,
        issue_date=now,
        file_path=pdf_path,
        verification_hash=verification_hash,
        metadata_json=cert_in.metadata_json or {}
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    # Notify student
    notif = Notification(
        user_id=student.id,
        title=f"Certificate Issued: {cert_in.title}",
        message=f"You have been awarded a Certificate of {cert_in.cert_type} ({cert_number}) by {current_user.full_name}.",
        notification_type="CERTIFICATE",
        link=f"/api/v1/certificates/download/{certificate.id}"
    )
    db.add(notif)
    db.commit()

    return CertificateOut(
        id=certificate.id,
        certificate_number=certificate.certificate_number,
        user_id=certificate.user_id,
        user_name=student.full_name,
        title=certificate.title,
        cert_type=certificate.cert_type,
        issue_date=certificate.issue_date,
        file_path=certificate.file_path,
        verification_hash=certificate.verification_hash,
        verification_url=verification_url
    )

@router.get("/my", response_model=List[CertificateOut])
def list_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    results = []
    for c in certs:
        v_url = f"{settings.PUBLIC_URL}/verify/{c.certificate_number}"
        results.append(CertificateOut(
            id=c.id,
            certificate_number=c.certificate_number,
            user_id=c.user_id,
            user_name=current_user.full_name,
            title=c.title,
            cert_type=c.cert_type,
            issue_date=c.issue_date,
            file_path=c.file_path,
            verification_hash=c.verification_hash,
            verification_url=v_url
        ))
    return results

@router.get("/download/{id}")
def download_certificate(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cert = db.query(Certificate).filter(Certificate.id == id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # If student, ensure it's their certificate
    if current_user.role == "STUDENT" and cert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to download this certificate")

    if not cert.file_path or not os.path.exists(cert.file_path):
        raise HTTPException(status_code=404, detail="Certificate PDF file is missing on server")

    return FileResponse(
        cert.file_path,
        media_type="application/pdf",
        filename=f"{cert.certificate_number}.pdf"
    )

@router.get("/verify/{cert_number}", response_model=CertificateVerifyOut)
def verify_certificate_public(
    cert_number: str,
    title_check: Optional[str] = None,  # For tamper detection testing
    db: Session = Depends(get_db)
):
    cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
    if not cert:
        return CertificateVerifyOut(
            is_valid=False,
            certificate_number=cert_number,
            student_name="Unknown",
            title="Record Not Found",
            cert_type="None",
            issue_date="N/A",
            issuer="N/A",
            tamper_detected=False
        )

    # Recompute cryptographic hash
    date_str = cert.issue_date.strftime("%Y-%m-%d")
    title_to_verify = title_check if title_check is not None else cert.title

    expected_hash = compute_certificate_hash(
        cert_number=cert.certificate_number,
        user_id=cert.user_id,
        title=title_to_verify,
        cert_type=cert.cert_type,
        issue_date_str=date_str
    )

    tamper_detected = (expected_hash != cert.verification_hash)
    is_valid = (not tamper_detected)

    return CertificateVerifyOut(
        is_valid=is_valid,
        certificate_number=cert.certificate_number,
        student_name=cert.user.full_name if cert.user else "MST Student",
        title=cert.title,
        cert_type=cert.cert_type,
        issue_date=cert.issue_date.strftime("%B %d, %Y"),
        issuer=cert.issuer.full_name if cert.issuer else "Directorate Advisor",
        tamper_detected=tamper_detected
    )
