from typing import List, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user

def normalize_role(role: str) -> str:
    r = (role or "").strip().upper().replace(" / ", "_").replace(" ", "_")
    if r in ["STUDENT_COORDINATOR", "COORDINATOR"]:
        return "COORDINATOR"
    if r in ["FACULTY_ADVISOR", "ADVISOR"]:
        return "ADVISOR"
    if r in ["CAMPUS_MANAGER"]:
        return "CAMPUS_MANAGER"
    if r in ["ADMIN", "ADMIN_PROGRAM_MANAGER", "PROGRAM_MANAGER"]:
        return "ADMIN"
    return "STUDENT"

def require_roles(allowed_roles: List[str]):
    normalized_allowed = {normalize_role(r) for r in allowed_roles}
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = normalize_role(current_user.role)
        if user_role not in normalized_allowed and user_role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if normalize_role(current_user.role) != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user

def require_coordinator_or_above(current_user: User = Depends(get_current_user)) -> User:
    user_role = normalize_role(current_user.role)
    if user_role not in ["COORDINATOR", "ADVISOR", "CAMPUS_MANAGER", "ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Coordinator privileges required")
    return current_user

def require_advisor_or_above(current_user: User = Depends(get_current_user)) -> User:
    user_role = normalize_role(current_user.role)
    if user_role not in ["ADVISOR", "CAMPUS_MANAGER", "ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Advisor privileges required")
    return current_user

def require_campus_manager_or_above(current_user: User = Depends(get_current_user)) -> User:
    user_role = normalize_role(current_user.role)
    if user_role not in ["CAMPUS_MANAGER", "ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Campus Manager or Administrator privileges required")
    return current_user
