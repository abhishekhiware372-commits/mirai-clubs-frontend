import io
import csv
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import AcademicCalendarEntry, Campus, User
from app.api.deps import get_current_user, require_admin, require_coordinator_or_above

router = APIRouter()

@router.get("/")
def list_calendar_entries(
    campus_id: Optional[str] = None,
    term: Optional[str] = None,
    entry_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AcademicCalendarEntry)
    if campus_id:
        query = query.filter((AcademicCalendarEntry.campus_id == campus_id) | (AcademicCalendarEntry.campus_id == None))
    if term:
        query = query.filter(AcademicCalendarEntry.term == term)
    if entry_type:
        query = query.filter(AcademicCalendarEntry.entry_type == entry_type)
    
    entries = query.order_by(AcademicCalendarEntry.date.asc()).all()
    results = []
    for e in entries:
        results.append({
            "id": e.id,
            "title": e.title,
            "date": e.date.isoformat(),
            "campus_id": e.campus_id,
            "campus_name": e.campus.name if e.campus else "All Campuses",
            "term": e.term,
            "entry_type": e.entry_type,
            "description": e.description,
            "created_at": e.created_at.isoformat()
        })
    return results

@router.post("/import-csv")
async def import_club_days_csv(
    file: UploadFile = File(...),
    campus_id: Optional[str] = None,
    term: Optional[str] = "Spring 2026",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    """
    Import Club Days from a standard CSV file with headers:
    title,date,description,entry_type
    """
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported_count = 0
    for row in reader:
        title = row.get("title") or row.get("Topic") or "Club Day"
        date_str = row.get("date") or row.get("Date")
        desc = row.get("description") or row.get("Description") or ""
        entry_type = row.get("entry_type") or row.get("Type") or "CLUB_DAY"
        
        if not date_str:
            continue
        
        try:
            # Handle multiple standard date formats
            entry_date = None
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    entry_date = datetime.strptime(date_str.strip(), fmt)
                    break
                except ValueError:
                    continue
            if not entry_date:
                continue

            entry = AcademicCalendarEntry(
                title=title.strip(),
                date=entry_date,
                campus_id=campus_id,
                term=term,
                entry_type=entry_type.strip(),
                description=desc.strip()
            )
            db.add(entry)
            imported_count += 1
        except Exception:
            continue

    db.commit()
    return {"success": True, "imported_entries": imported_count}
