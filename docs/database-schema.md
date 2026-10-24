# Database Schema — Report Management System

## Overview

The backend uses PostgreSQL as its relational database and SQLAlchemy as its ORM. Alembic manages database schema migrations.

Database name: `report_management_db`

## Tables

### 1. users

Stores user accounts and access-control information.

Expected fields based on the backend model:
- `id`: Primary key
- `name`: User's name
- `email`: User's email address
- `hashed_password`: Securely hashed password
- `role`: User role, such as `admin` or `user`
- `agency_id`: Agency assigned to the user; may be nullable for administrators
- `is_active`: Indicates whether the account is active

### 2. agencies

Stores agencies that organize report access.

Expected fields:
- `id`: Primary key
- Agency name and other agency attributes defined in the model
- Creation or update timestamps, if configured in the model

### 3. reports

Stores report metadata and ownership or agency associations.

Expected fields:
- `id`: Primary key
- Report metadata defined by the report model
- `agency_id`: Associated agency
- Creation and update information, if configured
- `is_deleted`: Soft-deletion flag

### 4. report_versions

Stores version metadata associated with reports.

Expected fields:
- `id`: Primary key
- `report_id`: Associated report
- Version metadata defined by the model
- Creator and timestamp information, if configured

### 5. audit_logs

Stores records of important actions performed through the backend.

Expected fields:
- `id`: Primary key
- Action or event type
- Affected entity type and ID
- User who performed the action, where recorded
- Timestamp and any additional metadata defined by the model

## Relationships

- A user may be assigned to an agency.
- An agency may have multiple users.
- An agency may contain multiple reports.
- A report may have multiple version records.
- Audit logs record relevant actions performed on backend entities.

## Data Integrity and Access

- Primary keys identify individual records.
- Foreign keys maintain relationships between related records.
- Regular users are restricted to reports in their assigned agency.
- Administrators can manage agencies, users, reports, report versions, and audit-log access according to the API permissions.
- Deleted reports are soft-deleted rather than physically removed.

## Migrations

Alembic migrations are used to manage schema changes. Do not edit migrations that have already been applied; create a new migration for future schema changes.

## Important Note

This document is a high-level overview. Verify exact column names, data types, constraints, indexes, and nullable fields against the current SQLAlchemy models and database before treating this document as the definitive schema reference.