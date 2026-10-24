
from getpass import getpass
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import User
from app.core.security import hash_password


def main():
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password (minimum 8 characters): ")

    if not name or not email or len(password) < 8:
        print("Name, email, and a password of at least 8 characters are required.")
        return

    db = SessionLocal()

    try:
        existing = db.scalar(
            select(User).where(User.email == email)
        )

        if existing:
            print("This email already exists. No account was created.")
            return

        admin = User(
            name=name,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
            agency_id=None,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"Admin account created successfully. User ID: {admin.id}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
