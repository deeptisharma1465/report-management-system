
from getpass import getpass
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import User
from app.core.security import hash_password


def main():
    email = input("Admin email: ").strip().lower()
    new_password = getpass("New password (minimum 8 characters): ")

    if len(new_password) < 8:
        print("Password must contain at least 8 characters.")
        return

    db = SessionLocal()

    try:
        admin = db.scalar(
            select(User).where(
                User.email == email,
                User.role == "admin"
            )
        )

        if admin is None:
            print("Admin account not found.")
            return

        admin.hashed_password = hash_password(new_password)

        db.commit()

        print("Admin password reset successfully!")
        print(f"Admin email: {admin.email}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
