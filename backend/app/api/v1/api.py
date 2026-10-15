from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, campuses, clubs, memberships, calendar, activities,
    attendance, submissions, evaluations, events, certificates,
    notifications, reports
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(campuses.router, prefix="/campuses", tags=["campuses"])
api_router.include_router(clubs.router, prefix="/clubs", tags=["clubs"])
api_router.include_router(memberships.router, prefix="/memberships", tags=["memberships"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
