from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError


def main() -> int:
    try:
        from app.db.session import engine

        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar_one()
    except (RuntimeError, SQLAlchemyError):
        print(
            "Database connection failed. Check DATABASE_URL in backend/.env "
            "and confirm PostgreSQL is running."
        )
        return 1

    if result != 1:
        print("Database connection check returned an unexpected result.")
        return 1

    print("Database connection successful (SELECT 1).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
