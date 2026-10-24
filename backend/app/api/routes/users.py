
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models import Agency, User
from app.schemas.user import UserManagementResponse, UserUpdate


router = APIRouter(prefix="/users", tags=["User Management"])


# LIST ALL USERS - ADMIN ONLY
@router.get("", response_model=list[UserManagementResponse])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[User]:
    query = select(User).order_by(User.id)
    return list(db.scalars(query).all())


# GET USER BY ID - ADMIN ONLY
@router.get("/{user_id}", response_model=UserManagementResponse)
def get_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


# UPDATE USER ROLE, AGENCY, OR ACTIVE STATUS - ADMIN ONLY
@router.patch("/{user_id}", response_model=UserManagementResponse)
def update_user(
    user_id: int,
    request: UserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    updates = request.model_dump(exclude_unset=True)

    # Prevent admins from accidentally removing their own admin role
    # or deactivating their own account.
    if user.id == admin.id:
        if updates.get("role") == "user" or updates.get("is_active") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot remove your own admin access or deactivate your own account.",
            )

    # Verify the target agency exists before assigning it.
    if "agency_id" in updates and updates["agency_id"] is not None:
        agency = db.get(Agency, updates["agency_id"])

        if agency is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agency not found.",
            )

    for field, value in updates.items():
        setattr(user, field, value)

    if updates:
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Could not update user because of a database constraint.",
            )

        db.refresh(user)

    return user
