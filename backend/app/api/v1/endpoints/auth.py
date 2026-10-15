from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.entities import User, Campus, Notification
from app.schemas.schemas import UserCreate, UserLogin, GoogleLoginRequest, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "student_id": user.student_id,
            "campus_id": user.campus_id,
            "department": user.department,
            "year": user.year
        }
    }

@router.post("/google-login", response_model=Token)
def google_login(google_data: GoogleLoginRequest, db: Session = Depends(get_db)):
    email = google_data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not registered in MIRAI CLUBS. Your verified Google account is not in the institutional registry. Please contact your Campus Administrator or Dean of Student Affairs to register your account."
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "student_id": user.student_id,
            "campus_id": user.campus_id,
            "department": user.department,
            "year": user.year
        }
    }

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    if user_in.student_id:
        existing_id = db.query(User).filter(User.student_id == user_in.student_id).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="Student ID / Mains ID is already registered")

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        student_id=user_in.student_id,
        role=user_in.role if user_in.role in ["STUDENT", "COORDINATOR", "ADVISOR", "CAMPUS_MANAGER", "ADMIN"] else "STUDENT",
        campus_id=user_in.campus_id,
        department=user_in.department,
        year=user_in.year,
        phone=user_in.phone,
        is_active=True,
        is_verified=True if user_in.student_id else False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to Mirai Clubs!",
        message="Your account is active. Browse clubs, register for Club Days, and participate in events.",
        notification_type="INFO"
    )
    db.add(welcome_notif)
    db.commit()

    return user

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
