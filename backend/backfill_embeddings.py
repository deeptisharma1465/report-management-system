"""One-time script: index every existing report.

Run from the backend folder:  python backfill_embeddings.py
"""
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Report
from app.services.search_service import index_report


def main() -> None:
    with SessionLocal() as db:
        ids = list(db.scalars(select(Report.id).where(Report.is_deleted.is_(False))))
        print(f"Indexing {len(ids)} reports...")
        for report_id in ids:
            index_report(db, report_id)
            print(f"  indexed report {report_id}")
    print("Done.")


if __name__ == "__main__":
    main()