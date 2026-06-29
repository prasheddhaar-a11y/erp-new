"""
PINESPHERE ERP
Module      : Profile Module
File        : profile.py
Purpose     : Defines Profile API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import service
from app.auth.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.models.token import RefreshToken
from app.models.user import User
from app.schemas.profile import ChangePasswordRequest, ProfilePhotoRequest, ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/profile", tags=["Profile"])


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _latest_session(db: Session, user_id: str) -> RefreshToken | None:
    return (
        db.query(RefreshToken)
        .filter(RefreshToken.user_id == user_id)
        .order_by(RefreshToken.login_at.desc(), RefreshToken.created_at.desc())
        .first()
    )


def _profile_response(db: Session, user: User) -> ProfileResponse:
    session = _latest_session(db, user.id)
    return ProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        role_abbreviation=user.role_abbreviation,
        branch_id=user.branch_id,
        franchise_id=user.franchise_id,
        profile_photo=user.profile_photo,
        email_verified=user.email_verified,
        email_verified_at=user.email_verified_at,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        updated_at=user.updated_at,
        last_login_device=session.device_info if session else None,
        last_login_ip=session.ip_address if session else None,
        last_login_browser=session.browser if session else None,
        last_login_operating_system=session.operating_system if session else None,
    )


def _validate_photo(value: str | None) -> str | None:
    if not value:
        return None
    if value.startswith("data:image/") or value.startswith("https://") or value.startswith("http://"):
        return value
    raise HTTPException(status_code=422, detail="Profile photo must be an image upload or a valid URL")


def _commit_profile(db: Session, user: User) -> ProfileResponse:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Phone already exists") from exc
    db.refresh(user)
    return _profile_response(db, user)


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/me", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _profile_response(db, current_user)


@router.patch("/me", response_model=ProfileResponse)
def update_profile(body: ProfileUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    payload = body.dict(exclude_unset=True)
    if "full_name" in payload:
        payload["full_name"] = payload["full_name"].strip()
    if "phone" in payload and payload["phone"] is not None:
        payload["phone"] = payload["phone"].strip() or None
    if "profile_photo" in payload:
        payload["profile_photo"] = _validate_photo(payload["profile_photo"])
    for field, value in payload.items():
        setattr(current_user, field, value)
    return _commit_profile(db, current_user)


@router.patch("/photo", response_model=ProfileResponse)
def update_photo(body: ProfilePhotoRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user.profile_photo = _validate_photo(body.profile_photo)
    return _commit_profile(db, current_user)


@router.patch("/change-password")
def change_password(body: ChangePasswordRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=422, detail="New password and confirmation do not match")
    service.validate_password_strength(body.new_password)
    if verify_password(body.new_password, current_user.hashed_password):
        raise HTTPException(status_code=422, detail="New password must be different from current password")
    current_user.hashed_password = hash_password(body.new_password)
    if body.logout_other_devices:
        service.force_logout_all_devices(current_user.id, db)
    else:
        db.commit()
    return {"message": "Password changed successfully. Please log in again."}
