"""
PINESPHERE ERP
Module      : Authentication Module
File        : auth.py
Purpose     : Defines Auth API endpoints and request handling
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

import secrets

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import service
from app.auth.dependencies import get_current_user, require_roles
from app.core.roles import UserRole, role_abbreviation
from app.core.security import hash_password
from app.db.database import get_db
from app.models.token import AuthActionToken, RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AssignRoleRequest,
    CompleteModalRegistrationRequest,
    CompletePasswordResetOtpRequest,
    CreateUserRequest,
    ForgotPasswordRequest,
    GoogleTokenRequest,
    InviteResponse,
    InviteTokenRequest,
    InviteUserRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetOwnPasswordRequest,
    ResendInviteRequest,
    RoleUpdateRequest,
    SetPasswordRequest,
    StartModalRegistrationRequest,
    StartOtpLoginRequest,
    StartPasswordResetOtpRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
    VerifyOtpLoginRequest,
    VerifyPasswordResetOtpRequest,
    VerifyEmailRequest,
    VerifyModalRegistrationRequest,
    VerifyRegistrationRequest,
)
from app.services.shared.history import add_history

router = APIRouter(prefix="/auth", tags=["Authentication"])
v1_auth_router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])

# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

MANAGER_ROLES = (UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.HR)
BRANCH_ADMIN_MANAGED_ROLES = {UserRole.STUDENT, UserRole.PARENT, UserRole.TRAINER, UserRole.COUNSELLOR, UserRole.HR, UserRole.FINANCE}
HR_MANAGED_ROLES = {UserRole.TRAINER, UserRole.COUNSELLOR, UserRole.HR, UserRole.FINANCE}


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _ensure_manager_scope(current_user: User, target: User) -> None:
    if current_user.role == UserRole.SUPER_ADMIN:
        return
    if not current_user.branch_id or target.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to manage users outside your branch")
    allowed_roles = HR_MANAGED_ROLES if current_user.role == UserRole.HR else BRANCH_ADMIN_MANAGED_ROLES
    if target.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not allowed to manage this user role")


def _managed_user(user_id: str, db: Session, current_user: User) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _ensure_manager_scope(current_user, user)
    return user


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.post("/login", response_model=TokenResponse)
@v1_auth_router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # =====================================================
    # SECTION: API CALLS
    # PURPOSE:
    # This section talks to backend or server endpoints.
    # It sends requests, receives responses, and prepares data for the UI.
    # =====================================================

    return service.login(body.login or body.email or "", body.password, db, request.client.host if request.client else None, request.headers.get("user-agent"), body.remember_me)


@v1_auth_router.post("/otp/start")
def start_otp_login(body: StartOtpLoginRequest, request: Request, db: Session = Depends(get_db)):
    return service.start_otp_login(body.login, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/otp/verify", response_model=TokenResponse)
def verify_otp_login(body: VerifyOtpLoginRequest, request: Request, db: Session = Depends(get_db)):
    return service.verify_otp_login(body.login, body.otp, db, request.client.host if request.client else None, request.headers.get("user-agent"), body.remember_me)


@router.post("/refresh")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    return service.refresh_access_token(body.refresh_token, db)


@router.post("/logout")
def logout(body: RefreshRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service.logout(current_user.id, body.refresh_token, db)
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
@v1_auth_router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    return service.forgot_password(body.login or body.email or "", db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/password-reset/start")
def start_password_reset_otp(body: StartPasswordResetOtpRequest, request: Request, db: Session = Depends(get_db)):
    return service.start_password_reset_otp(body.login, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/password-reset/verify")
def verify_password_reset_otp(body: VerifyPasswordResetOtpRequest, request: Request, db: Session = Depends(get_db)):
    return service.verify_password_reset_otp(body.login, body.otp, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/password-reset/complete")
def complete_password_reset_otp(body: CompletePasswordResetOtpRequest, db: Session = Depends(get_db)):
    return service.reset_password(body.reset_token, body.new_password, body.confirm_password, db, body.logout_other_devices)


@router.post("/reset-password")
@v1_auth_router.post("/reset-password")
def reset_password(body: ResetOwnPasswordRequest, db: Session = Depends(get_db)):
    return service.reset_password(body.reset_token or body.token or "", body.new_password, body.confirm_password, db, body.logout_other_devices)


@v1_auth_router.post("/register")
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    return service.start_registration(body.model_dump(), db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/register/verify")
def verify_registration(body: VerifyRegistrationRequest, request: Request, db: Session = Depends(get_db)):
    return service.verify_registration(str(body.email), body.otp, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/register/start")
def start_modal_registration(body: StartModalRegistrationRequest, request: Request, db: Session = Depends(get_db)):
    return service.start_modal_registration(body.full_name, body.login, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/register/verify-otp")
def verify_modal_registration(body: VerifyModalRegistrationRequest, request: Request, db: Session = Depends(get_db)):
    return service.verify_modal_registration(body.login, body.otp, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@v1_auth_router.post("/register/complete", response_model=TokenResponse)
def complete_modal_registration(body: CompleteModalRegistrationRequest, request: Request, db: Session = Depends(get_db)):
    return service.complete_modal_registration(body.registration_token, body.password, body.confirm_password, db, request.client.host if request.client else None, request.headers.get("user-agent"), body.remember_me)


@v1_auth_router.get("/google/login")
def google_login():
    return RedirectResponse(service.google_authorization_url())


@v1_auth_router.get("/google/callback")
async def google_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    token_response = await service.exchange_google_code(code, state, db, request.client.host if request.client else None, request.headers.get("user-agent"))
    from urllib.parse import urlencode

    params = urlencode({"access_token": token_response["access_token"], "refresh_token": token_response["refresh_token"]})
    return RedirectResponse(f"{service.settings.FRONTEND_BASE_URL.rstrip('/')}/login?{params}")


@v1_auth_router.post("/google/token", response_model=TokenResponse)
async def google_token(body: GoogleTokenRequest, request: Request, db: Session = Depends(get_db)):
    return await service.login_with_google_id_token(body.id_token, db, request.client.host if request.client else None, request.headers.get("user-agent"), body.remember_me)


@router.post("/send-verification")
def send_verification(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return service.send_verification(current_user, db, request.client.host if request.client else None, request.headers.get("user-agent"))


@router.post("/verify-email")
def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    return service.verify_email(body.token, db)


@router.post("/accept-invite")
def accept_invite(body: InviteTokenRequest, db: Session = Depends(get_db)):
    return service.accept_invite(body.token, db)


@router.post("/set-password")
def set_password(body: SetPasswordRequest, db: Session = Depends(get_db)):
    return service.set_invite_password(body.token, body.new_password, body.confirm_password, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(body: ProfileUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    for field, value in body.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Phone already exists") from exc
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=list[UserResponse])
def list_users(role: UserRole | None = Query(default=None), db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.HR, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT, UserRole.COUNSELLOR))):
    query = db.query(User).order_by(User.full_name.asc())
    if current_user.role in {UserRole.STUDENT, UserRole.PARENT}:
        return query.filter(User.id == current_user.id).all()
    if role:
        query = query.filter(User.role == role)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.branch_id == current_user.branch_id)
    if current_user.role == UserRole.TRAINER:
        query = query.filter(User.role == UserRole.STUDENT)
    if current_user.role == UserRole.HR:
        query = query.filter(User.role.in_(HR_MANAGED_ROLES))
    return query.limit(500).all()


@router.get("/users/invites", response_model=list[InviteResponse])
def list_invites(db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    query = db.query(User).filter(User.invite_status.isnot(None)).order_by(User.invite_sent_at.desc(), User.created_at.desc())
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.branch_id == current_user.branch_id)
    if current_user.role == UserRole.HR:
        query = query.filter(User.role.in_(HR_MANAGED_ROLES))
    return query.limit(100).all()


@router.get("/students/search", response_model=list[UserResponse])
def search_students(
    q: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER)),
):
    query_text = q.strip().lower()
    query = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,  # noqa: E712
        or_(User.student_status == None, User.student_status != "removed"),  # noqa: E711
    )
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.branch_id == current_user.branch_id)
    students = query.limit(500).all()

    if not query_text:
        return sorted(students, key=lambda student: student.full_name.lower())

    def match_score(student: User) -> int:
        values = [
            student.full_name,
            student.email,
            student.phone,
            student.display_code,
            student.parent_name,
            student.parent_phone,
            student.course_enrolled,
            student.batch_name,
            student.trainer_name,
        ]
        searchable = " ".join(str(value or "") for value in values).lower()
        name = (student.full_name or "").lower()
        code = (student.display_code or "").lower()
        if name.startswith(query_text) or code.startswith(query_text):
            return 0
        if query_text in name or query_text in code:
            return 1
        if query_text in searchable:
            return 2
        return 99

    matches = [student for student in students if match_score(student) < 99]
    return sorted(matches, key=match_score)


@router.post("/users")
def create_user(body: CreateUserRequest, db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    service.validate_password_strength(body.password)
    payload = body.dict(exclude={"password"})
    payload["email"] = body.email.strip().lower()
    payload["role_abbreviation"] = role_abbreviation(body.role)
    if current_user.role == UserRole.BRANCH_ADMIN:
        if body.role not in BRANCH_ADMIN_MANAGED_ROLES:
            raise HTTPException(status_code=403, detail="Branch admin can create only branch students and staff")
        payload["branch_id"] = current_user.branch_id
    if current_user.role == UserRole.HR:
        if body.role not in HR_MANAGED_ROLES:
            raise HTTPException(status_code=403, detail="HR can create only branch staff")
        payload["branch_id"] = current_user.branch_id
    user = User(**payload, hashed_password=hash_password(body.password))
    db.add(user)
    try:
        db.flush()
        if body.role == UserRole.STUDENT:
            add_history(
                db,
                module="students",
                action="created",
                title=f"Student added: {user.full_name}",
                details=f"Email: {user.email} | Phone: {user.phone or '-'} | Course: {user.course_enrolled or '-'} | Batch: {user.batch_name or '-'} | Parent: {user.parent_name or '-'}",
                record_id=user.id,
                created_by_id=current_user.id,
                branch_id=user.branch_id,
            )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or phone already exists") from exc
    return {"message": "User created", "id": user.id}


@router.patch("/users/assign-role", response_model=UserResponse)
def assign_role(body: AssignRoleRequest, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    user.role_abbreviation = role_abbreviation(body.role)
    user.branch_id = body.branch_id
    user.is_active = body.is_active
    if body.student_status is not None:
        user.student_status = body.student_status
    if body.batch_name is not None:
        user.batch_name = body.batch_name
    if body.trainer_name is not None:
        user.trainer_name = body.trainer_name
    if body.role == UserRole.STUDENT:
        add_history(
            db,
            module="students",
            action="updated",
            title=f"Student status updated: {user.full_name}",
            details=f"Active: {user.is_active} | Status: {user.student_status or '-'} | Batch: {user.batch_name or '-'} | Trainer: {user.trainer_name or '-'}",
            record_id=user.id,
            created_by_id=current_user.id,
            branch_id=user.branch_id,
        )
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/invite")
@users_router.post("/invite")
def invite_user(body: InviteUserRequest, request: Request, response: Response, db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    email = body.email.strip().lower()
    temporary_password = body.temporary_password.strip() if body.temporary_password else None
    expected_abbreviation = role_abbreviation(body.role)
    if body.role_abbreviation != expected_abbreviation:
        raise HTTPException(status_code=400, detail=f"Role abbreviation must be {expected_abbreviation} for {body.role.value}.")
    if body.invite_method == "temporary" and not temporary_password:
        raise HTTPException(status_code=400, detail="Temporary password is required when invite method is temporary.")
    if body.invite_method == "auto" and temporary_password:
        raise HTTPException(status_code=400, detail="Temporary password must be empty when invite method is auto.")
    if temporary_password:
        service.validate_password_strength(temporary_password)
    password = temporary_password or f"Invite@{secrets.token_urlsafe(6)}1"
    full_name = (body.full_name or email.split("@", 1)[0].replace(".", " ").replace("_", " ").title()).strip() or "Invited User"

    if current_user.role == UserRole.BRANCH_ADMIN:
        if body.role not in BRANCH_ADMIN_MANAGED_ROLES:
            raise HTTPException(status_code=403, detail="Branch admin can invite only branch students and staff")
        branch_id = current_user.branch_id
    elif current_user.role == UserRole.HR:
        if body.role not in HR_MANAGED_ROLES:
            raise HTTPException(status_code=403, detail="HR can invite only branch staff")
        branch_id = current_user.branch_id
    else:
        branch_id = body.branch_id

    user = db.query(User).filter(User.email == email).first()
    created = user is None
    if user:
        _ensure_manager_scope(current_user, user)
        if user.is_active:
            raise HTTPException(status_code=409, detail="This email is already registered as an active user.")
        if user.invite_status in {"pending", "sent", "delivered", "failed", "expired"} and not body.reactivate_existing:
            raise HTTPException(status_code=409, detail="A pending invite already exists for this email. Use Resend Invite.")
        if not body.reactivate_existing:
            raise HTTPException(status_code=409, detail="This user already exists but is inactive. Confirm reactivation to resend the invite.")
        user.full_name = body.full_name.strip() if body.full_name else user.full_name
        user.role = body.role
        user.role_abbreviation = role_abbreviation(body.role)
        user.branch_id = branch_id
        user.franchise_id = body.franchise_id
        user.hashed_password = hash_password(password)
    else:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=body.role,
            role_abbreviation=role_abbreviation(body.role),
            branch_id=branch_id,
            franchise_id=body.franchise_id,
            is_active=False,
            email_verified=False,
        )
        db.add(user)

    raw_token = service.create_invite_token(user)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or phone already exists") from exc

    response.status_code = 201 if created else 200
    return service.deliver_invite_email(
        db,
        user,
        raw_token,
        temporary_password,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        created=created,
    )


@router.post("/resend-invite")
def resend_invite(body: ResendInviteRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    if not body.user_id and not body.email:
        raise HTTPException(status_code=422, detail="Provide user_id or email")
    query = db.query(User)
    user = query.filter(User.id == body.user_id).first() if body.user_id else query.filter(User.email == str(body.email).strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invite not found")
    _ensure_manager_scope(current_user, user)
    if user.is_active or user.invite_status == "accepted":
        raise HTTPException(status_code=409, detail="This email is already registered as an active user.")
    if user.invite_status not in {"pending", "sent", "delivered", "failed", "expired"}:
        raise HTTPException(status_code=409, detail="This user is inactive. Confirm reactivation before resending the invite.")
    raw_token = service.create_invite_token(user)
    return service.deliver_invite_email(
        db,
        user,
        raw_token,
        None,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
    )


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    body: ResetPasswordRequest | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*MANAGER_ROLES)),
):
    user = _managed_user(user_id, db, current_user)
    temporary_password = body.temporary_password if body and body.temporary_password else f"Reset@{secrets.token_urlsafe(6)}1"
    service.validate_password_strength(temporary_password)
    user.hashed_password = hash_password(temporary_password)
    service.force_logout_all_devices(user.id, db)
    return {"message": "Password reset successfully", "temporary_password": temporary_password}


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(user_id: str, body: RoleUpdateRequest, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    user = _managed_user(user_id, db, current_user)
    user.role = body.role
    user.role_abbreviation = role_abbreviation(body.role)
    user.branch_id = body.branch_id
    user.franchise_id = body.franchise_id
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, body: UserUpdateRequest, db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    user = _managed_user(user_id, db, current_user)

    payload = body.dict(exclude_unset=True)
    password = payload.pop("password", None)
    if current_user.role != UserRole.SUPER_ADMIN:
        payload.pop("branch_id", None)
        payload.pop("franchise_id", None)

    for field, value in payload.items():
        setattr(user, field, value)
    if password:
        service.validate_password_strength(password)
        user.hashed_password = hash_password(password)

    if user.role == UserRole.STUDENT:
        add_history(
            db,
            module="students",
            action="updated",
            title=f"Student details updated: {user.full_name}",
            details=f"Email: {user.email} | Phone: {user.phone or '-'} | Course: {user.course_enrolled or '-'} | Batch: {user.batch_name or '-'}",
            record_id=user.id,
            created_by_id=current_user.id,
            branch_id=user.branch_id,
        )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or phone already exists") from exc
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
@users_router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user=Depends(require_roles(*MANAGER_ROLES))):
    user = _managed_user(user_id, db, current_user)
    deleted_email = user.email
    deleted_name = user.full_name
    if user.role == UserRole.STUDENT:
        add_history(
            db,
            module="students",
            action="deleted",
            title=f"Student deleted: {user.full_name}",
            details=f"Email: {user.email} | Phone: {user.phone or '-'} | Course: {user.course_enrolled or '-'}",
            record_id=user.id,
            created_by_id=current_user.id,
            branch_id=user.branch_id,
        )

    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete(synchronize_session=False)
    db.query(AuthActionToken).filter(AuthActionToken.user_id == user.id).delete(synchronize_session=False)
    db.query(AuthActionToken).filter(AuthActionToken.user_id == f"registration:{deleted_email}").delete(synchronize_session=False)
    service._audit(  # noqa: SLF001
        db,
        current_user.id,
        "user_deleted",
        new_value=f"{deleted_name} <{deleted_email}>",
        severity="warning",
    )
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "user_id": user_id}
