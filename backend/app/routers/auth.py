"""Auth router — register, login, and profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.psychologist import PsychologistProfile
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: DBSession = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        first_name=data.first_name,
        last_name=data.last_name,
        age=data.age,
        phone=data.phone,
    )
    db.add(user)
    db.flush()


    if data.role == "patient":
        # Business logic: Auto-balance the load. We assign the new patient
        # to the psychologist who currently has the fewest active patients.
        from sqlalchemy import func
        psi = (
            db.query(PsychologistProfile)
            .outerjoin(PatientProfile, PatientProfile.psychologist_id == PsychologistProfile.id)
            .group_by(PsychologistProfile.id)
            .order_by(func.count(PatientProfile.id))
            .first()
        )
        db.add(PatientProfile(user_id=user.id, psychologist_id=psi.id if psi else None))
    elif data.role == "psychologist":
        db.add(PsychologistProfile(user_id=user.id))

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, role=user.role)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, role=user.role)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
