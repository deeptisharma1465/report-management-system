# Status Values — Report Management System

## 1. User Roles

The backend currently supports these roles:

| Value | Description |
|---|---|
| `admin` | Administrator with privileged management access |
| `user` | Regular authenticated user with agency-level restrictions |

Public registration creates regular users. Administrator privileges are assigned through authorized user-management functionality.

## 2. User Account Status

The user model uses an `is_active` field to represent account status.

| Value | Meaning |
|---|---|
| `true` | Account is active |
| `false` | Account is inactive |

Inactive accounts should not be allowed to access protected functionality if account activity is enforced by the authentication dependencies.

## 3. Report Deletion Status

Reports use an `is_deleted` field for soft deletion.

| Value | Meaning |
|---|---|
| `false` | Report is not soft-deleted |
| `true` | Report is soft-deleted |

Soft-deleted reports are excluded from normal report listings. Soft deletion preserves the database record instead of physically deleting it.

## 4. Audit Action Types

The backend currently records these report-related audit actions:

| Value | Meaning |
|---|---|
| `report_created` | A report was created |
| `report_updated` | Report metadata was updated |
| `report_deleted` | A report was soft-deleted |
| `report_version_created` | Version metadata was created for a report |

## 5. Report Version Information

Report versions are stored as metadata associated with a report. The exact version-number format and any additional version fields are defined by the current SQLAlchemy model and schema.

## 6. Important Note

This document summarizes status values known from the current backend implementation. Before adding new values, verify the relevant SQLAlchemy models, Pydantic schemas, and route validation rules. Keep this document synchronized with future code and database changes.