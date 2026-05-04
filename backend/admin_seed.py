import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

def update_admin():
    db = SessionLocal()

    new_admin = db.query(User).filter(User.email == 'hpalacios@mindcare.com').first()
    admin_pass = os.getenv("ADMIN_PASSWORD")
    if not admin_pass:
        raise ValueError("ADMIN_PASSWORD environment variable must be set!")

    if not new_admin:
        admin_user = User(
            email="hpalacios@mindcare.com",
            password_hash=hash_password(admin_pass),
            role="admin",
            first_name="Héctor",
            last_name="Palacios",
            age=30,
        )
        db.add(admin_user)
        db.commit()
        print("Admin Héctor Palacios creado!")
    else:
        print("Admin Héctor ya existia.")
    db.close()

if __name__ == "__main__":
    update_admin()
