"""Admin router — platform overview and user management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.checkin import Checkin
from app.services.auth_service import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin=Depends(require_role("admin"))
):
    """Returns aggregated platform metrics and recent users."""
    
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_psychologists = db.query(User).filter(User.role == "psychologist").count()
    total_checkins = db.query(Checkin).count()
    
    # Calculate global average emotion intensity
    avg_intensity = db.query(func.avg(Checkin.intensity)).scalar() or 0.0

    return {
        "metrics": {
            "total_patients": total_patients,
            "total_psychologists": total_psychologists,
            "total_checkins": total_checkins,
            "avg_intensity": round(avg_intensity, 1),
            "system_health": "100%",
            "active_ai_models": 1
        },
        "recent_users": [
            {
                "id": str(u.id),
                "name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in db.query(User).order_by(User.created_at.desc()).limit(50).all()
        ]
    }


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin=Depends(require_role("admin"))
):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot deactivate admin users")
    
    user.is_active = not user.is_active
    db.commit()
    return {"id": str(user.id), "is_active": user.is_active}
