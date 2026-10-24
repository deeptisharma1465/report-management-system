# Permissions and Access Control — Report Management System

## Overview

The backend uses JWT-based authentication and role-based access control (RBAC) to protect API endpoints.

The supported roles are:
- `admin`
- `user`

## Authentication

- Public registration creates a regular user account.
- Users log in to obtain a JWT access token.
- Protected endpoints require the token in the `Authorization` header.

Header format:

`Authorization: Bearer <access_token>`

## Role Permissions

| Feature | Admin | Regular User |
|---|---|---|
| Register an account | Public registration creates regular users | Public registration creates regular users |
| Log in | Yes | Yes |
| View own account details | Yes | Yes |
| Check administrator access | Yes | No |
| Create agencies | Yes | No |
| List agencies | Yes | No |
| Update agencies | Yes | No |
| List users | Yes | No |
| View a user's details | Yes | No |
| Update user role, agency, or active status | Yes | No |
| Create reports | Subject to agency access rules | Only within the assigned agency |
| List reports | According to report access rules | Reports restricted to the assigned agency |
| View an individual report | Subject to agency access rules | Only if permitted for the assigned agency |
| Update report metadata | Yes | No |
| Soft-delete reports | Yes | No |
| Create report version metadata | Yes | No |
| List report versions | Yes | No |
| View audit logs | Yes | No |

## Agency Isolation

Regular users must not access reports belonging to another agency.

The backend applies agency-access checks when handling report operations. Report listing also excludes soft-deleted reports.

## Audit Logging

The backend records relevant report actions, including:
- `report_created`
- `report_updated`
- `report_deleted`
- `report_version_created`

Audit-log access is restricted to administrators.

## HTTP Status Codes

- `401 Unauthorized`: Authentication is missing or invalid.
- `403 Forbidden`: The authenticated user does not have the required permissions.
- `404 Not Found`: The requested resource is unavailable or does not exist.

## Security Notes

- Passwords must be stored as hashes, not plaintext.
- Access tokens should be kept confidential.
- Do not commit `.env` files or secrets to version control.
- Public registration must not allow users to register themselves as administrators.

## Scope

These permissions cover the current backend functionality. Any future endpoint must enforce authentication, role permissions, and agency-level access where applicable.