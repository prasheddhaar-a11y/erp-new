"""
PINESPHERE ERP
Module      : Authentication Module
File        : service.py
Purpose     : Provides Service backend functionality
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

from datetime import datetime, timedelta
import asyncio
import hashlib
import json
import logging
import re
import secrets
import urllib.error
import urllib.parse
import urllib.request

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.roles import UserRole, role_abbreviation
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.token import AuditLog, AuthActionToken, RefreshToken, SecurityEvent
from app.models.user import User
from app.services.email import (
    EmailDeliveryError,
    send_auth_otp_email,
    send_invite_email,
    send_password_reset_email,
    send_verification_email,
    validate_email_address,
)


# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15
PASSWORD_RESET_MINUTES = 30
EMAIL_VERIFICATION_HOURS = 24
INVITE_STATUSES = {"pending", "sent", "delivered", "accepted", "expired", "failed"}
# =====================================================
# SECTION: LOGGING
# PURPOSE:
# This section records useful runtime information for debugging and audits.
# Logs help developers understand what happened during a request or task.
# =====================================================

logger = logging.getLogger(__name__)


# =====================================================
# SECTION: SERVICES
# PURPOSE:
# This section contains business logic used by routes or other modules.
# Services keep workflows separate from request handling code.
# =====================================================

# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _otp_hash(subject: str, purpose: str, otp: str) -> str:
    return _token_hash(f"{subject}:{purpose}:{otp}")


def _normalize_identifier(identifier: str) -> tuple[str, str]:
    value = identifier.strip()
    if "@" in value:
        return "email", value.lower()
    phone = re.sub(r"[^\d+]", "", value)
    return "phone", phone


def _find_user_by_login(identifier: str, db: Session) -> User | None:
    identifier_type, normalized = _normalize_identifier(identifier)
    if identifier_type == "email":
        return db.query(User).filter(User.email == normalized).first()
    return db.query(User).filter(User.phone == normalized).first()


def _device_fingerprint(ip_address: str | None, user_agent: str | None) -> str:
    return hashlib.sha256(f"{ip_address or ''}|{user_agent or ''}".encode("utf-8")).hexdigest()


def _parse_device(user_agent: str | None) -> tuple[str, str, str]:
    value = user_agent or ""
    browser = "Unknown browser"
    if "Edg/" in value:
        browser = "Microsoft Edge"
    elif "Chrome/" in value:
        browser = "Chrome"
    elif "Firefox/" in value:
        browser = "Firefox"
    elif "Safari/" in value:
        browser = "Safari"

    operating_system = "Unknown OS"
    if "Windows" in value:
        operating_system = "Windows"
    elif "Mac OS X" in value:
        operating_system = "macOS"
    elif "Android" in value:
        operating_system = "Android"
    elif "iPhone" in value or "iPad" in value:
        operating_system = "iOS"
    elif "Linux" in value:
        operating_system = "Linux"

    return f"{browser} on {operating_system}", browser, operating_system


def _stored_refresh_token(db: Session, refresh_token: str):
    return db.query(RefreshToken).filter(
        or_(RefreshToken.token_hash == _token_hash(refresh_token), RefreshToken.token == refresh_token)
    )


def _audit(
    db: Session,
    user_id: str,
    action: str,
    ip_address: str | None = None,
    *,
    module: str | None = "security",
    action_type: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    user_agent: str | None = None,
    severity: str = "info",
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            module=module,
            action_type=action_type or action,
            old_value=old_value,
            new_value=new_value,
            user_agent=user_agent,
            severity=severity,
        )
    )


def _security_event(db: Session, event_type: str, severity: str, ip_address: str | None, user_agent: str | None, details: str, user_id: str | None = None) -> None:
    db.add(SecurityEvent(user_id=user_id, event_type=event_type, severity=severity, ip_address=ip_address, user_agent=user_agent, details=details))


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    checks = [
        (r"[A-Z]", "one uppercase letter"),
        (r"[a-z]", "one lowercase letter"),
        (r"\d", "one number"),
        (r"[^A-Za-z0-9]", "one special character"),
    ]
    missing = [message for pattern, message in checks if not re.search(pattern, password)]
    if missing:
        raise HTTPException(status_code=422, detail=f"Password must include {', '.join(missing)}.")


def role_label(role: UserRole | str) -> str:
    value = role.value if isinstance(role, UserRole) else role
    return value.replace("_", " ").title()


def _create_action_token(db: Session, user: User, purpose: str, expires_at: datetime, ip_address: str | None, user_agent: str | None) -> str:
    raw_token = secrets.token_urlsafe(48)
    db.add(
        AuthActionToken(
            user_id=user.id,
            token_hash=_token_hash(raw_token),
            purpose=purpose,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )
    return raw_token


def _issue_session(
    db: Session,
    user: User,
    ip_address: str | None,
    user_agent: str | None,
    *,
    remember_me: bool = False,
    audit_action: str = "login",
):
    now = datetime.utcnow()
    user.failed_login_attempts = "0"
    user.locked_until = None
    user.last_login_at = now
    access_token = create_access_token(user.id, user.role.value)
    ttl_days = settings.KEEP_ME_REFRESH_TOKEN_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    refresh_token, expires_at = create_refresh_token(user.id, ttl_days)
    device_info, browser, operating_system = _parse_device(user_agent)
    db.add(
        RefreshToken(
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            token_hash=_token_hash(refresh_token),
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=device_info,
            browser=browser,
            operating_system=operating_system,
            device_fingerprint=_device_fingerprint(ip_address, user_agent),
            login_at=now,
            status="active",
        )
    )
    _audit(db, user.id, audit_action, ip_address, user_agent=user_agent)
    db.commit()
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "full_name": user.full_name,
            "role": user.role,
            "role_abbreviation": user.role_abbreviation,
            "branch_id": user.branch_id,
            "franchise_id": user.franchise_id,
            "is_active": user.is_active,
            "profile_photo": user.profile_photo,
            "email_verified": user.email_verified,
            "email_verified_at": user.email_verified_at,
            "display_code": user.display_code,
            "last_login_at": user.last_login_at,
        },
    }


def _ensure_can_login(user: User, db: Session, ip_address: str | None, user_agent: str | None) -> None:
    if not user.is_active:
        _audit(db, user.id, "blocked_login_inactive_account", ip_address, user_agent=user_agent, severity="warning")
        db.commit()
        raise HTTPException(status_code=403, detail="Your account is inactive. Please contact administrator.")
    if user.invite_status in {"pending", "sent", "delivered", "failed", "expired"}:
        _audit(db, user.id, "blocked_login_invite_not_accepted", ip_address, user_agent=user_agent, severity="warning")
        db.commit()
        raise HTTPException(status_code=403, detail="Your invite has not been accepted yet. Please check your email.")


def _latest_action_token(db: Session, subject: str, purpose: str) -> AuthActionToken | None:
    return (
        db.query(AuthActionToken)
        .filter(AuthActionToken.user_id == subject, AuthActionToken.purpose == purpose)
        .order_by(AuthActionToken.created_at.desc())
        .first()
    )


def _create_otp(
    db: Session,
    subject: str,
    purpose: str,
    ip_address: str | None,
    user_agent: str | None,
    *,
    metadata: dict | None = None,
) -> str:
    latest = _latest_action_token(db, subject, purpose)
    cooldown_cutoff = datetime.utcnow() - timedelta(seconds=settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS)
    if latest and not latest.used_at and latest.created_at > cooldown_cutoff:
        seconds_left = settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS - int((datetime.utcnow() - latest.created_at).total_seconds())
        raise HTTPException(status_code=429, detail=f"Please wait {max(seconds_left, 1)} seconds before requesting another OTP.")
    otp = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        AuthActionToken(
            user_id=subject,
            token_hash=_otp_hash(subject, purpose, otp),
            purpose=purpose,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.AUTH_OTP_EXPIRE_MINUTES),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
    )
    return otp


def _consume_otp(db: Session, subject: str, purpose: str, otp: str) -> AuthActionToken:
    stored = _latest_action_token(db, subject, purpose)
    if not stored or stored.used_at or stored.expires_at < datetime.utcnow() or stored.token_hash != _otp_hash(subject, purpose, otp.strip()):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    stored.used_at = datetime.utcnow()
    return stored


def _handle_otp_delivery_error(exc: EmailDeliveryError, recipient: str) -> None:
    if settings.AUTH_DEBUG_OTP:
        logger.warning("OTP email delivery failed for %s, continuing because AUTH_DEBUG_OTP is enabled: %s", recipient, exc)
        return
    raise HTTPException(status_code=502, detail=f"OTP could not be sent. {exc}") from exc


def create_invite_token(user: User) -> str:
    raw_token = secrets.token_urlsafe(48)
    user.invite_token_hash = _token_hash(raw_token)
    user.invite_expires_at = datetime.utcnow() + timedelta(hours=settings.INVITE_TOKEN_EXPIRE_HOURS)
    user.invite_accepted_at = None
    user.invite_status = "pending"
    user.is_active = False
    return raw_token


def _invite_link(raw_token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL.rstrip('/')}/accept-invite?token={raw_token}"


def deliver_invite_email(db: Session, user: User, raw_token: str, temporary_password: str | None, ip_address: str | None = None, user_agent: str | None = None, *, created: bool = False):
    if not user.invite_expires_at:
        raise HTTPException(status_code=422, detail="Invite expiry is missing")
    try:
        user.email = validate_email_address(user.email)
    except EmailDeliveryError as exc:
        user.invite_status = "failed"
        user.invite_sent_at = datetime.utcnow()
        _security_event(db, "invite_email_failed", "warning", ip_address, user_agent, str(exc), user.id)
        _audit(db, user.id, "invite_email_failed", ip_address, new_value=str(exc), user_agent=user_agent, severity="warning")
        db.commit()
        raise HTTPException(status_code=422, detail="Please enter a valid email address.") from exc
    try:
        send_invite_email(
            to_email=user.email,
            full_name=user.full_name,
            role_label=role_label(user.role),
            invite_link=_invite_link(raw_token),
            expires_at=user.invite_expires_at.isoformat(),
            temporary_password=temporary_password,
        )
    except EmailDeliveryError as exc:
        logger.exception("Invite SMTP delivery failed for %s", user.email)
        user.invite_status = "failed"
        user.invite_sent_at = datetime.utcnow()
        _security_event(db, "invite_email_failed", "warning", ip_address, user_agent, str(exc), user.id)
        _audit(db, user.id, "invite_email_failed", ip_address, new_value=str(exc), user_agent=user_agent, severity="warning")
        db.commit()
        detail = "User created but invite email failed to send. Please check email configuration." if created else "Invite email failed to send. Please check email configuration."
        raise HTTPException(status_code=502, detail=detail) from exc
    user.invite_status = "delivered"
    user.invite_sent_at = datetime.utcnow()
    _audit(db, user.id, "invite_email_delivered", ip_address, new_value=user.email, user_agent=user_agent)
    db.commit()
    return {
        "message": f"Invite email sent to {user.email}.",
        "id": user.id,
        "email": user.email,
        "invite_status": user.invite_status,
        "invite_sent_at": user.invite_sent_at,
        "invite_expires_at": user.invite_expires_at,
    }


def invite_by_token(raw_token: str, db: Session) -> User:
    user = db.query(User).filter(User.invite_token_hash == _token_hash(raw_token)).first()
    if not user or user.invite_status not in {"pending", "sent", "delivered", "failed"}:
        raise HTTPException(status_code=400, detail="Invalid invite token. If this link was opened before, ask an admin to resend the invite.")
    if not user.invite_expires_at or user.invite_expires_at < datetime.utcnow():
        user.invite_status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invite token has expired")
    return user


def accept_invite(raw_token: str, db: Session):
    user = invite_by_token(raw_token, db)
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "invite_expires_at": user.invite_expires_at,
    }


def set_invite_password(raw_token: str, new_password: str, confirm_password: str, db: Session):
    if new_password != confirm_password:
        raise HTTPException(status_code=422, detail="New password and confirmation do not match")
    validate_password_strength(new_password)
    user = invite_by_token(raw_token, db)
    user.hashed_password = hash_password(new_password)
    user.is_active = True
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    user.invite_accepted_at = datetime.utcnow()
    user.invite_status = "accepted"
    user.invite_token_hash = None
    _audit(db, user.id, "invite_accepted")
    db.commit()
    return {"message": "Invite accepted. You can now log in with your email and password."}


def _consume_action_token(db: Session, raw_token: str, purpose: str) -> User:
    stored = (
        db.query(AuthActionToken)
        .filter(AuthActionToken.token_hash == _token_hash(raw_token), AuthActionToken.purpose == purpose)
        .first()
    )
    if not stored or stored.used_at or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == stored.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    stored.used_at = datetime.utcnow()
    return user


def login(identifier: str, password: str, db: Session, ip_address: str | None = None, user_agent: str | None = None, remember_me: bool = False):
    identifier_type, normalized = _normalize_identifier(identifier)
    user = _find_user_by_login(normalized, db)
    if user and user.locked_until and user.locked_until > datetime.utcnow():
        _security_event(db, "blocked_login_locked_account", "warning", ip_address, user_agent, f"Locked login attempt for {normalized}", user.id)
        db.commit()
        raise HTTPException(status_code=423, detail="Account is temporarily locked")

    if not user or not verify_password(password, user.hashed_password):
        if user:
            failed_count = int(user.failed_login_attempts or "0") + 1
            user.failed_login_attempts = str(failed_count)
            if failed_count >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCK_MINUTES)
                _security_event(db, "account_locked", "critical", ip_address, user_agent, f"Account locked after {failed_count} failed attempts", user.id)
        _audit(db, user.id if user else "unknown", "failed_login", ip_address, user_agent=user_agent, severity="warning")
        db.commit()
        noun = "email" if identifier_type == "email" else "phone number"
        raise HTTPException(status_code=401, detail=f"Invalid {noun} or password")
    _ensure_can_login(user, db, ip_address, user_agent)
    return _issue_session(db, user, ip_address, user_agent, remember_me=remember_me)


def start_otp_login(identifier: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    user = _find_user_by_login(identifier, db)
    if user:
        _ensure_can_login(user, db, ip_address, user_agent)
        otp = _create_otp(db, user.id, "otp_login", ip_address, user_agent, metadata={"login": identifier})
        _audit(db, user.id, "otp_login_requested", ip_address, user_agent=user_agent)
        db.commit()
        try:
            send_auth_otp_email(
                to_email=user.email,
                full_name=user.full_name,
                otp=otp,
                purpose_label="login",
                expires_in_minutes=settings.AUTH_OTP_EXPIRE_MINUTES,
            )
        except EmailDeliveryError as exc:
            logger.exception("OTP login email failed for %s", user.email)
            _handle_otp_delivery_error(exc, user.email)
        response = {"message": "If the account exists, an OTP has been sent.", "cooldown_seconds": settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS}
        if settings.AUTH_DEBUG_OTP:
            response["debug_otp"] = otp
        return response
    return {"message": "If the account exists, an OTP has been sent.", "cooldown_seconds": settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS}


def verify_otp_login(identifier: str, otp: str, db: Session, ip_address: str | None = None, user_agent: str | None = None, remember_me: bool = False):
    user = _find_user_by_login(identifier, db)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    _ensure_can_login(user, db, ip_address, user_agent)
    _consume_otp(db, user.id, "otp_login", otp)
    return _issue_session(db, user, ip_address, user_agent, remember_me=remember_me, audit_action="otp_login")


def forgot_password(identifier: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    return start_password_reset_otp(identifier, db, ip_address, user_agent)


def start_password_reset_otp(identifier: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    generic = {"message": "If the account exists, a password reset OTP has been sent.", "cooldown_seconds": settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS}
    user = _find_user_by_login(identifier, db)
    if user and user.is_active:
        otp = _create_otp(db, user.id, "password_reset_otp", ip_address, user_agent, metadata={"login": identifier})
        _audit(db, user.id, "password_reset_requested", ip_address, user_agent=user_agent)
        db.commit()
        try:
            send_auth_otp_email(
                to_email=user.email,
                full_name=user.full_name,
                otp=otp,
                purpose_label="password reset",
                expires_in_minutes=settings.AUTH_OTP_EXPIRE_MINUTES,
            )
        except EmailDeliveryError as exc:
            logger.exception("Password reset email failed for %s", user.email)
            _handle_otp_delivery_error(exc, user.email)
        if settings.AUTH_DEBUG_OTP:
            generic["debug_otp"] = otp
        return generic
    if user:
        _audit(db, user.id, "blocked_password_reset_inactive_account", ip_address, user_agent=user_agent, severity="warning")
        db.commit()
    return generic


def verify_password_reset_otp(identifier: str, otp: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    user = _find_user_by_login(identifier, db)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    _consume_otp(db, user.id, "password_reset_otp", otp)
    reset_token = _create_action_token(
        db,
        user,
        "password_reset_verified",
        datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_MINUTES),
        ip_address,
        user_agent,
    )
    _audit(db, user.id, "password_reset_otp_verified", ip_address, user_agent=user_agent)
    db.commit()
    return {"message": "OTP verified. Set a new password.", "reset_token": reset_token}


def reset_password(token: str, new_password: str, confirm_password: str, db: Session, logout_other_devices: bool = True):
    if new_password != confirm_password:
        raise HTTPException(status_code=422, detail="New password and confirmation do not match")
    validate_password_strength(new_password)
    try:
        user = _consume_action_token(db, token, "password_reset_verified")
    except HTTPException:
        user = _consume_action_token(db, token, "password_reset")
    user.hashed_password = hash_password(new_password)
    if logout_other_devices:
        force_logout_all_devices(user.id, db)
    _audit(db, user.id, "password_reset_completed")
    db.commit()
    return {"message": "Password reset successfully. Please log in with your new password."}


def send_verification(user: User, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    if user.email_verified:
        return {"message": "Email is already verified."}
    token = _create_action_token(
        db, user, "email_verification",
        datetime.utcnow() + timedelta(hours=EMAIL_VERIFICATION_HOURS),
        ip_address, user_agent,
    )
    verification_link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={token}"
    _audit(db, user.id, "email_verification_sent", ip_address, user_agent=user_agent)
    db.commit()
    try:
        send_verification_email(
            to_email=user.email,
            full_name=user.full_name,
            verification_link=verification_link,
        )
    except EmailDeliveryError:
        logger.exception("Verification email failed for %s", user.email)
    return {"message": "Verification email sent."}


def verify_email(token: str, db: Session):
    user = _consume_action_token(db, token, "email_verification")
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    _audit(db, user.id, "email_verified")
    db.commit()
    return {"message": "Email verification completed."}


def start_registration(payload: dict, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    try:
        email = validate_email_address(payload["email"])
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=422, detail="Please enter a valid email address.") from exc
    phone = re.sub(r"[^\d+]", "", payload["phone"].strip())
    if payload["password"] != payload["confirm_password"]:
        raise HTTPException(status_code=422, detail="Password and confirmation do not match")
    validate_password_strength(payload["password"])
    if not payload["accepted_terms"] or not payload["accepted_privacy_policy"] or not payload["accepted_refund_policy"]:
        raise HTTPException(status_code=422, detail="Terms, Privacy Policy, and Refund Policy must be accepted")
    if payload["country"].strip().lower() == "india" and not (payload.get("state") or "").strip():
        raise HTTPException(status_code=422, detail="State is required for India")
    existing = db.query(User).filter(or_(User.email == email, User.phone == phone)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email or phone already exists")
    subject = f"registration:{email}"
    pending = {
        "full_name": payload["full_name"].strip(),
        "email": email,
        "phone": phone,
        "country": payload["country"].strip(),
        "state": (payload.get("state") or "").strip() or None,
        "password_hash": hash_password(payload["password"]),
    }
    otp = _create_otp(db, subject, "registration_email", ip_address, user_agent, metadata=pending)
    db.commit()
    try:
        send_auth_otp_email(
            to_email=email,
            full_name=pending["full_name"],
            otp=otp,
            purpose_label="registration",
            expires_in_minutes=settings.AUTH_OTP_EXPIRE_MINUTES,
        )
    except EmailDeliveryError as exc:
        logger.exception("Registration OTP email failed for %s", email)
        _handle_otp_delivery_error(exc, email)
    response = {"message": "Registration OTP sent.", "cooldown_seconds": settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS}
    if settings.AUTH_DEBUG_OTP:
        response["debug_otp"] = otp
    return response


def verify_registration(email: str, otp: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    normalized_email = email.strip().lower()
    subject = f"registration:{normalized_email}"
    stored = _consume_otp(db, subject, "registration_email", otp)
    if not stored.metadata_json:
        raise HTTPException(status_code=400, detail="Registration payload is missing")
    payload = json.loads(stored.metadata_json)
    existing = db.query(User).filter(or_(User.email == payload["email"], User.phone == payload["phone"])).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email or phone already exists")
    try:
        role = UserRole(settings.DEFAULT_REGISTRATION_ROLE)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Default registration role is invalid") from exc
    user = User(
        email=payload["email"],
        phone=payload["phone"],
        full_name=payload["full_name"],
        hashed_password=payload["password_hash"],
        role=role,
        role_abbreviation=role_abbreviation(role),
        is_active=True,
        email_verified=True,
        email_verified_at=datetime.utcnow(),
        student_status="active" if role == UserRole.STUDENT else "active",
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or phone already exists") from exc
    _audit(db, user.id, "registered", ip_address, user_agent=user_agent)
    db.commit()
    return {"message": "Account created. You can now log in.", "id": user.id}


def start_modal_registration(full_name: str, identifier: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    identifier_type, normalized = _normalize_identifier(identifier)
    if identifier_type != "email":
        raise HTTPException(status_code=422, detail="Email is required for registration OTP until SMS delivery is configured.")
    try:
        normalized = validate_email_address(normalized)
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=422, detail="Please enter a valid email address.") from exc
    existing = db.query(User).filter(User.email == normalized).first()
    if existing:
        raise HTTPException(status_code=409, detail="This email is already registered. Please log in.")
    subject = f"registration:{normalized}"
    pending = {"full_name": full_name.strip(), "email": normalized}
    otp = _create_otp(db, subject, "modal_registration_otp", ip_address, user_agent, metadata=pending)
    db.commit()
    try:
        send_auth_otp_email(
            to_email=normalized,
            full_name=pending["full_name"],
            otp=otp,
            purpose_label="registration",
            expires_in_minutes=settings.AUTH_OTP_EXPIRE_MINUTES,
        )
    except EmailDeliveryError as exc:
        logger.exception("Modal registration OTP email failed for %s", normalized)
        _handle_otp_delivery_error(exc, normalized)
    response = {"message": "Registration OTP sent.", "cooldown_seconds": settings.AUTH_OTP_RESEND_COOLDOWN_SECONDS}
    if settings.AUTH_DEBUG_OTP:
        response["debug_otp"] = otp
    return response


def verify_modal_registration(identifier: str, otp: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    identifier_type, normalized = _normalize_identifier(identifier)
    if identifier_type != "email":
        raise HTTPException(status_code=422, detail="Email is required for registration OTP until SMS delivery is configured.")
    subject = f"registration:{normalized}"
    stored = _consume_otp(db, subject, "modal_registration_otp", otp)
    raw_token = secrets.token_urlsafe(48)
    db.add(
        AuthActionToken(
            user_id=subject,
            token_hash=_token_hash(raw_token),
            purpose="modal_registration_verified",
            expires_at=datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_MINUTES),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=stored.metadata_json,
        )
    )
    db.commit()
    return {"message": "OTP verified. Set your password.", "registration_token": raw_token}


def complete_modal_registration(registration_token: str, password: str, confirm_password: str, db: Session, ip_address: str | None = None, user_agent: str | None = None, remember_me: bool = True):
    if password != confirm_password:
        raise HTTPException(status_code=422, detail="Password and confirmation do not match")
    validate_password_strength(password)
    stored = (
        db.query(AuthActionToken)
        .filter(AuthActionToken.token_hash == _token_hash(registration_token), AuthActionToken.purpose == "modal_registration_verified")
        .first()
    )
    if not stored or stored.used_at or stored.expires_at < datetime.utcnow() or not stored.metadata_json:
        raise HTTPException(status_code=400, detail="Invalid or expired registration token")
    payload = json.loads(stored.metadata_json)
    email = payload["email"].strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="This email is already registered. Please log in.")
    try:
        role = UserRole(settings.DEFAULT_REGISTRATION_ROLE)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Default registration role is invalid") from exc
    user = User(
        email=email,
        full_name=payload["full_name"].strip(),
        hashed_password=hash_password(password),
        role=role,
        role_abbreviation=role_abbreviation(role),
        is_active=True,
        email_verified=True,
        email_verified_at=datetime.utcnow(),
        student_status="active",
    )
    stored.used_at = datetime.utcnow()
    db.add(user)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="This email is already registered. Please log in.") from exc
    _audit(db, user.id, "registered", ip_address, user_agent=user_agent)
    return _issue_session(db, user, ip_address, user_agent, remember_me=remember_me, audit_action="registration_login")


def _google_oauth_configured() -> None:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")


async def _http_get_json(url: str, params: dict[str, str]) -> tuple[int, dict]:
    try:
        import httpx  # type: ignore
    except ModuleNotFoundError:
        def request() -> tuple[int, dict]:
            full_url = f"{url}?{urllib.parse.urlencode(params)}"
            try:
                with urllib.request.urlopen(full_url, timeout=10) as response:
                    body = response.read().decode("utf-8")
                    return response.status, json.loads(body or "{}")
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8")
                return exc.code, json.loads(body or "{}")

        return await asyncio.to_thread(request)

    # =====================================================
    # SECTION: API CALLS
    # PURPOSE:
    # This section talks to backend or server endpoints.
    # It sends requests, receives responses, and prepares data for the UI.
    # =====================================================

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
    return response.status_code, response.json()


async def _http_post_form_json(url: str, data: dict[str, str | None]) -> tuple[int, dict]:
    clean_data = {key: value or "" for key, value in data.items()}
    try:
        import httpx  # type: ignore
    except ModuleNotFoundError:
        def request() -> tuple[int, dict]:
            encoded = urllib.parse.urlencode(clean_data).encode("utf-8")
            req = urllib.request.Request(url, data=encoded, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    body = response.read().decode("utf-8")
                    return response.status, json.loads(body or "{}")
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8")
                return exc.code, json.loads(body or "{}")

        return await asyncio.to_thread(request)

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(url, data=clean_data)
    return response.status_code, response.json()


def google_authorization_url() -> str:
    _google_oauth_configured()
    redirect_uri = settings.GOOGLE_REDIRECT_URI or f"{settings.FRONTEND_BASE_URL.rstrip('/')}/auth/google/callback"
    state_payload = {
        "nonce": secrets.token_urlsafe(24),
        "type": "google_oauth_state",
        "exp": int((datetime.utcnow() + timedelta(minutes=settings.GOOGLE_OAUTH_STATE_EXPIRE_MINUTES)).timestamp()),
    }
    from jose import jwt

    state = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    from urllib.parse import urlencode

    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def _find_or_create_google_user(profile: dict, db: Session) -> User:
    email = str(profile.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not return an email address")
    user = db.query(User).filter(User.email == email).first()
    if user:
        if profile.get("email_verified") and not user.email_verified:
            user.email_verified = True
            user.email_verified_at = datetime.utcnow()
        return user
    try:
        role = UserRole(settings.DEFAULT_REGISTRATION_ROLE)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Default registration role is invalid") from exc
    user = User(
        email=email,
        full_name=str(profile.get("name") or email.split("@", 1)[0]).strip(),
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        role=role,
        role_abbreviation=role_abbreviation(role),
        is_active=True,
        email_verified=bool(profile.get("email_verified", True)),
        email_verified_at=datetime.utcnow() if profile.get("email_verified", True) else None,
    )
    db.add(user)
    db.flush()
    return user


async def login_with_google_id_token(id_token: str, db: Session, ip_address: str | None = None, user_agent: str | None = None, remember_me: bool = False):
    _google_oauth_configured()
    status_code, profile = await _http_get_json("https://oauth2.googleapis.com/tokeninfo", {"id_token": id_token})
    if status_code >= 400:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    if profile.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")
    user = _find_or_create_google_user(profile, db)
    _ensure_can_login(user, db, ip_address, user_agent)
    return _issue_session(db, user, ip_address, user_agent, remember_me=remember_me, audit_action="google_login")


async def exchange_google_code(code: str, state: str, db: Session, ip_address: str | None = None, user_agent: str | None = None, remember_me: bool = True):
    _google_oauth_configured()
    try:
        payload = decode_token(state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state") from exc
    if payload.get("type") != "google_oauth_state":
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state")
    redirect_uri = settings.GOOGLE_REDIRECT_URI or f"{settings.FRONTEND_BASE_URL.rstrip('/')}/auth/google/callback"
    status_code, token_payload = await _http_post_form_json(
        "https://oauth2.googleapis.com/token",
        {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    if status_code >= 400:
        raise HTTPException(status_code=401, detail="Google authorization failed")
    id_token = token_payload.get("id_token")
    if not id_token:
        raise HTTPException(status_code=401, detail="Google did not return an ID token")
    return await login_with_google_id_token(id_token, db, ip_address, user_agent, remember_me=remember_me)


def refresh_access_token(refresh_token: str, db: Session):
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token type")
    stored = _stored_refresh_token(db, refresh_token).filter(RefreshToken.revoked == False).first()  # noqa: E712
    if not stored or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired or revoked")
    stored.last_used_at = datetime.utcnow()
    stored.status = "active"
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        stored.revoked = True
        stored.logout_at = datetime.utcnow()
        stored.status = "revoked"
        db.commit()
        raise HTTPException(status_code=401, detail="Inactive or missing user")
    db.commit()
    return {"access_token": create_access_token(user.id, user.role.value), "token_type": "bearer"}


def logout(user_id: str, refresh_token: str, db: Session):
    stored = _stored_refresh_token(db, refresh_token).filter(RefreshToken.user_id == user_id).first()
    if stored:
        stored.revoked = True
        stored.logout_at = datetime.utcnow()
        stored.status = "logged_out"
    _audit(db, user_id, "logout")
    db.commit()


def force_logout_all_devices(user_id: str, db: Session, ip_address: str | None = None, user_agent: str | None = None):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False).update(  # noqa: E712
        {"revoked": True, "logout_at": datetime.utcnow(), "status": "revoked"}
    )
    _audit(db, user_id, "force_logout_all_devices", ip_address, user_agent=user_agent, severity="warning")
    db.commit()
