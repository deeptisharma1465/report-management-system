
# API Contract — Report Management System

## Base URL

Local development: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

All API routes below use the `/api` prefix unless specified otherwise.

## Authentication

Authentication uses JWT bearer tokens.

After a successful login, send the token in the request header:

`Authorization: Bearer <access_token>`

Access tokens expire according to the configured JWT expiration setting.

## Authentication Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a regular user |
| POST | `/api/auth/login` | Public | Authenticate and obtain a token |
| GET | `/api/auth/me` | Authenticated | Get the current user's details |
| GET | `/api/auth/admin-check` | Admin | Verify administrator access |

## Agency Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/agencies` | Admin | Create an agency |
| GET | `/api/agencies` | Authenticated | List agencies |
| PATCH | `/api/agencies/{agency_id}` | Admin | Update an agency |

## User Management Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/{user_id}` | Admin | Get a user's details |
| PATCH | `/api/users/{user_id}` | Admin | Update role, agency assignment or active status |

## Report Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/reports` | Authenticated | Create a report for an existing agency |
| GET | `/api/reports` | Authenticated | List the current user's reports; admins can list all |
| GET | `/api/reports/{report_id}` | Authenticated | Get an owned report; admins can get any |
| GET | `/api/reports/{report_id}/file` | Authenticated | Download an owned report; admins can download any |
| GET | `/api/reports/{report_id}/preview` | Authenticated | Preview an owned report as PDF; admins can preview any |
| PATCH | `/api/reports/{report_id}` | Admin | Update report metadata |
| DELETE | `/api/reports/{report_id}` | Admin | Soft-delete a report |
| POST | `/api/reports/{report_id}/versions` | Admin | Create report version metadata |
| GET | `/api/reports/{report_id}/versions` | Admin | List report versions |

## Audit Log Endpoint

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/audit-logs` | Admin | List audit records |

Optional query parameters:

- `limit`: number of records, from 1 to 100; default 20.
- `offset`: number of records to skip; default 0.

Example: `/api/audit-logs?limit=10&offset=0`

## Health Endpoint

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Check application health |

## Common HTTP Status Codes

- `200 OK`: Request completed successfully.
- `201 Created`: Resource created successfully.
- `204 No Content`: Successful deletion.
- `401 Unauthorized`: Missing or invalid authentication credentials.
- `403 Forbidden`: Authenticated user lacks permission.
- `404 Not Found`: Requested resource does not exist or is unavailable.
- `409 Conflict`: Resource conflicts with an existing record.
- `422 Unprocessable Entity`: Request validation failed.

## Notes

- Public registration creates regular users, not administrators.
- Registration does not assign an agency to the new user.
- Regular users can list agencies and choose one when uploading a report.
- Regular users can list, search, preview, and download only reports they uploaded.
- Report deletion is a soft delete.
- Office document previews require LibreOffice on the server; generated previews are cached.
- Report version records store version metadata; this endpoint does not itself implement file storage or document processing.
- Verify endpoint behavior against the running application when making future changes.
