# AI-Powered Intelligent Report Management System

## Overview

The Report Management System backend provides APIs for authentication, user management, agency management, report management, report version metadata, and audit logging.

The backend uses FastAPI, PostgreSQL, SQLAlchemy, and Alembic.

## Technology Stack

- **Language:** Python
- **Backend framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Database migrations:** Alembic
- **Authentication:** JWT bearer tokens
- **API testing:** Pytest and FastAPI TestClient

## Project Structure

```text
report-management-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   ├── .env
│   └── requirements.txt
├── docs/
│   ├── api-contract.md
│   ├── database-schema.md
│   ├── permissions.md
│   └── status-values.md
└── README.md
```

## Features Implemented

- User registration and login
- JWT-based authentication
- Role-based access control for administrators and regular users
- Agency creation, listing, and updating
- User listing and management by administrators
- Agency-restricted report access
- Report creation, listing, and retrieval
- Report metadata updates
- Soft deletion of reports
- Report version metadata management
- Audit logging for report-related actions
- Paginated audit-log retrieval
- Health-check endpoint
- Automated backend tests

## Prerequisites

Install the following before running the backend:

- Python
- PostgreSQL
- Git (if cloning the repository)

## Local Setup

### 1. Open the backend directory

```powershell
cd backend
```

### 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the backend directory and configure the database connection and required application settings.

Use the project's existing configuration and example environment file, if available, to determine the required variable names.

**Never commit `.env` files, database passwords, JWT secrets, or access tokens to Git.**

### 5. Apply database migrations

```powershell
alembic upgrade head
```

Ensure PostgreSQL is running and the database connection is configured correctly before applying migrations.

### 6. Start the backend

From the backend directory, run:

```powershell
uvicorn app.main:app --reload
```

The local API will be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 7. Check application health

Open this URL in your browser:

`http://127.0.0.1:8000/health`

Expected response:

```json
{
  "status": "ok"
}
```

## Running Tests

From the backend directory, with the virtual environment activated:

```powershell
python -m pytest -q
```

The current test suite has passed **9 tests** in the latest recorded run. Run the tests again after making code changes to confirm the current result.

## API Documentation

See the following files in the `docs/` directory:

- `api-contract.md` — API endpoints and access requirements
- `database-schema.md` — Database tables and relationships
- `permissions.md` — Roles and access-control rules
- `status-values.md` — Known roles, status fields, and audit action types

## Current Scope

This backend covers core application functionality, authentication, authorization, report metadata, version metadata, and audit logging.

File storage, document-processing pipelines, and AI-powered functionality are outside the scope of this backend task unless separately assigned and implemented.

## Security Notes

- Store passwords as secure hashes.
- Protect JWT secrets and database credentials.
- Use authorized administrator accounts for privileged operations.
- Enforce agency-level access restrictions.
- Keep dependencies and security configurations updated.

## Development Status

Core backend APIs and initial automated tests are implemented. Continue validating endpoint behavior, database constraints, error handling, and security before production deployment.