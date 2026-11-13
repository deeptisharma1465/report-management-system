
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User


bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(bearer_scheme),
    ],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.isdigit():
            raise credentials_error

        user_id = int(subject)

    except (jwt.InvalidTokenError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise credentials_error

    return user

def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return current_user


def can_access_agency(current_user: User, agency_id: int) -> bool:
    """Admins can access any agency; users only their assigned agency."""
    if current_user.role == "admin":
        return True

    return (
        current_user.role == "user"
        and current_user.agency_id == agency_id
    )


def require_agency_access(
    agency_id: int,
    current_user: User = Depends(get_current_user),
) -> User:
    if not can_access_agency(current_user, agency_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this agency.",
        )

    return current_user
