"""
PINESPHERE ERP
Module      : Authentication Module
File        : auth.py
Purpose     : Defines Auth request and response schemas
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

from typing import Literal
import re

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from datetime import date, datetime

from app.core.roles import UserRole


# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

STRICT_EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$")


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _validate_strict_email(value: EmailStr | str | None) -> EmailStr | str | None:
    if value is None:
        return value
    email = str(value).strip().lower()
    if not STRICT_EMAIL_PATTERN.fullmatch(email):
        # =====================================================
        # SECTION: ERROR HANDLING
        # PURPOSE:
        # This section handles expected failures and converts them into useful responses.
        # Good error handling keeps the app stable when something goes wrong.
        # =====================================================

        raise ValueError("Please enter a valid email address.")
    if email.endswith(".cor"):
        raise ValueError("Email domain looks invalid. Did you mean .com?")
    return value


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class LoginRequest(BaseModel):
    login: str | None = None
    email: str | None = None
    password: str
    remember_me: bool = False

    @model_validator(mode="after")
    def require_login_identifier(self):
        if not (self.login or self.email):
            raise ValueError("Email or phone is required")
        return self


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    login: str | None = None
    email: str | None = None

    @model_validator(mode="after")
    def require_login_identifier(self):
        if not (self.login or self.email):
            raise ValueError("Email or phone is required")
        return self


class ResetOwnPasswordRequest(BaseModel):
    token: str | None = None
    reset_token: str | None = None
    new_password: str
    confirm_password: str
    logout_other_devices: bool = True

    @model_validator(mode="after")
    def require_reset_token(self):
        if not (self.token or self.reset_token):
            raise ValueError("Reset token is required")
        return self


class StartOtpLoginRequest(BaseModel):
    login: str


class VerifyOtpLoginRequest(BaseModel):
    login: str
    otp: str = Field(min_length=4, max_length=12)
    remember_me: bool = False


class StartPasswordResetOtpRequest(BaseModel):
    login: str


class VerifyPasswordResetOtpRequest(BaseModel):
    login: str
    otp: str = Field(min_length=4, max_length=12)


class CompletePasswordResetOtpRequest(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: str
    logout_other_devices: bool = True


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=32)
    country: str = Field(min_length=2, max_length=80)
    state: str | None = Field(default=None, max_length=80)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    accepted_terms: bool
    accepted_privacy_policy: bool
    accepted_refund_policy: bool

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return _validate_strict_email(value)  # type: ignore[return-value]


class VerifyRegistrationRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=12)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return _validate_strict_email(value)  # type: ignore[return-value]


class StartModalRegistrationRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    login: str


class VerifyModalRegistrationRequest(BaseModel):
    login: str
    otp: str = Field(min_length=4, max_length=12)


class CompleteModalRegistrationRequest(BaseModel):
    registration_token: str
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    remember_me: bool = True


class GoogleTokenRequest(BaseModel):
    id_token: str
    remember_me: bool = False


class VerifyEmailRequest(BaseModel):
    token: str


class InviteTokenRequest(BaseModel):
    token: str


class SetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class ResendInviteRequest(BaseModel):
    user_id: str | None = None
    email: EmailStr | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr | None) -> EmailStr | None:
        return _validate_strict_email(value)  # type: ignore[return-value]


class InviteResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    role_abbreviation: str | None = None
    branch_id: str | None = None
    franchise_id: str | None = None
    invite_sent_at: datetime | None = None
    invite_expires_at: datetime | None = None
    invite_accepted_at: datetime | None = None
    invite_status: str | None = None

    class Config:
        from_attributes = True


class CreateUserRequest(BaseModel):
    email: EmailStr
    phone: str | None = None
    full_name: str
    password: str
    role: UserRole
    branch_id: str | None = None
    franchise_id: str | None = None
    profile_photo: str | None = None
    is_active: bool = True
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    parent_name: str | None = None
    parent_phone: str | None = None
    emergency_contact: str | None = None
    course_enrolled: str | None = None
    batch_name: str | None = None
    trainer_name: str | None = None
    student_status: str = "active"
    document_status: str = "pending"
    admission_date: date | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        return _validate_strict_email(value)  # type: ignore[return-value]


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    full_name: str | None = None
    password: str | None = None
    branch_id: str | None = None
    franchise_id: str | None = None
    profile_photo: str | None = None
    is_active: bool | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    parent_name: str | None = None
    parent_phone: str | None = None
    emergency_contact: str | None = None
    course_enrolled: str | None = None
    batch_name: str | None = None
    trainer_name: str | None = None
    student_status: str | None = None
    document_status: str | None = None
    admission_date: date | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr | None) -> EmailStr | None:
        return _validate_strict_email(value)  # type: ignore[return-value]


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    phone: str | None = None
    full_name: str
    role: UserRole
    role_abbreviation: str | None = None
    branch_id: str | None = None
    franchise_id: str | None = None
    is_active: bool
    profile_photo: str | None = None
    email_verified: bool | None = None
    email_verified_at: datetime | None = None
    invite_sent_at: datetime | None = None
    invite_expires_at: datetime | None = None
    invite_accepted_at: datetime | None = None
    invite_status: str | None = None
    two_factor_enabled: bool | None = None
    display_code: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    parent_name: str | None = None
    parent_phone: str | None = None
    emergency_contact: str | None = None
    course_enrolled: str | None = None
    batch_name: str | None = None
    trainer_name: str | None = None
    student_status: str | None = None
    document_status: str | None = None
    admission_date: date | None = None
    last_login_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    user_id: str
    role: UserRole
    branch_id: str | None = None
    is_active: bool = True
    student_status: str | None = None
    batch_name: str | None = None
    trainer_name: str | None = None


class RoleUpdateRequest(BaseModel):
    role: UserRole
    branch_id: str | None = None
    franchise_id: str | None = None


class ResetPasswordRequest(BaseModel):
    temporary_password: str | None = None


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: UserRole
    role_abbreviation: str
    full_name: str | None = None
    branch_id: str | None = None
    franchise_id: str | None = None
    invite_method: Literal["auto", "temporary"]
    temporary_password: str | None = None
    reactivate_existing: bool = False

    @field_validator("email")
    @classmethod
    def reject_common_domain_typo(cls, value: EmailStr) -> EmailStr:
        return _validate_strict_email(value)  # type: ignore[return-value]


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    emergency_contact: str | None = None
    profile_photo: str | None = None
