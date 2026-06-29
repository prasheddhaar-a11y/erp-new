"""
PINESPHERE ERP
Module      : Demo OTP / Demo Class Email
File        : app/api/demo_otp.py
Purpose     : Sends and verifies demo class OTP using SMTP/SMS providers and sends demo confirmation emails.
"""

from datetime import datetime, timedelta
import base64
import json
import os
import random
import smtplib
import ssl
import urllib.error
import urllib.parse
import urllib.request
from email.message import EmailMessage
from typing import TypedDict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr


# This name is required because main.py imports:
# from app.api.demo_otp import router as demo_otp_router
router = APIRouter(prefix="/demo-otp", tags=["Demo OTP"])


class OtpRecord(TypedDict):
    code: str
    expires_at: datetime


_otp_store: dict[str, OtpRecord] = {}
_env_loaded = False


class OtpSendRequest(BaseModel):
    email: EmailStr
    mobile: str | None = None


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    mobile: str | None = None


class ConfirmationEmailRequest(BaseModel):
    email: EmailStr
    subject: str = "Pinesphere ERP - Demo Class Booking Confirmation"
    message: str


class DemoBookingEmailRequest(BaseModel):
    email: EmailStr
    student_name: str | None = None
    mobile: str | None = None
    course: str | None = None
    demo_date: str | None = None
    demo_mode: str | None = None


def _normalize_mobile(mobile: str) -> str:
    cleaned = "".join(ch for ch in mobile.strip() if ch.isdigit() or ch == "+")
    if not cleaned:
        raise HTTPException(status_code=400, detail="Mobile number is required")
    if cleaned.startswith("+"):
        return cleaned
    if len(cleaned) == 10:
        return f"+91{cleaned}"
    return cleaned


def _normalize_email(email: str) -> str:
    cleaned = email.strip().lower()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Email address is required")
    return cleaned


def _load_env_file() -> None:
    """Load backend .env values when uvicorn was started from a different directory."""
    global _env_loaded
    if _env_loaded:
        return
    _env_loaded = True

    possible_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
        os.path.abspath(os.path.join(os.getcwd(), ".env")),
        os.path.abspath(os.path.join(os.getcwd(), "backend", ".env")),
    ]

    for env_path in possible_paths:
        if not os.path.exists(env_path):
            continue
        with open(env_path, "r", encoding="utf-8") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        break


def _get_provider() -> str:
    """
    Provider priority:
    1. OTP_PROVIDER if explicitly set.
    2. smtp automatically when SMTP settings exist.
    3. SMS_PROVIDER fallback.
    4. test fallback.

    This fixes the common issue where SMS_PROVIDER=demo prevents real email sending
    even though SMTP settings are available.
    """
    _load_env_file()
    explicit_provider = os.getenv("OTP_PROVIDER")
    if explicit_provider:
        return explicit_provider.lower()

    if os.getenv("SMTP_HOST") and os.getenv("SMTP_USERNAME") and os.getenv("SMTP_PASSWORD"):
        return "smtp"

    return os.getenv("SMS_PROVIDER", "test").lower()


def _send_otp(email: str, mobile: str | None, message: str) -> None:
    provider = _get_provider()

    if provider in {"test", "demo"}:
        return

    if provider == "smtp":
        _send_email(email, message, "Your Pinesphere demo class OTP")
        return

    if provider == "fast2sms":
        if not mobile:
            raise HTTPException(status_code=400, detail="Mobile number is required for Fast2SMS OTP")
        _send_fast2sms(_normalize_mobile(mobile), message)
        return

    if provider == "twilio":
        if not mobile:
            raise HTTPException(status_code=400, detail="Mobile number is required for Twilio OTP")
        _send_twilio(_normalize_mobile(mobile), message)
        return

    raise HTTPException(status_code=503, detail="OTP_PROVIDER must be test, smtp, twilio, or fast2sms")


def _send_email(to_email: str, message: str, subject: str) -> None:
    _load_env_file()

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL") or username
    from_name = os.getenv("SMTP_FROM_NAME", "Pinesphere ERP")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"}
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() in {"1", "true", "yes", "on"}

    if not host or not username or not password or not from_email:
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL in backend/.env.",
        )

    email_message = EmailMessage()
    email_message["Subject"] = subject
    email_message["From"] = f"{from_name} <{from_email}>"
    email_message["To"] = to_email
    email_message.set_content(message)

    try:
        if use_ssl or port == 465:
            with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context(), timeout=15) as server:
                server.login(username, password)
                server.send_message(email_message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                if use_tls:
                    server.starttls(context=ssl.create_default_context())
                server.login(username, password)
                server.send_message(email_message)
    except smtplib.SMTPAuthenticationError as exc:
        raise HTTPException(
            status_code=502,
            detail="Gmail rejected the SMTP username or app password. Check SMTP_USERNAME and SMTP_PASSWORD in backend/.env.",
        ) from exc
    except smtplib.SMTPException as exc:
        raise HTTPException(status_code=502, detail=f"Unable to send email: {exc}") from exc
    except OSError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach email provider") from exc


def _send_twilio(to_mobile: str, message: str) -> None:
    _load_env_file()

    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    if not sid or not token or not from_number:
        raise HTTPException(status_code=503, detail="Twilio SMS is not configured.")

    data = urllib.parse.urlencode({"To": to_mobile, "From": from_number, "Body": message}).encode()
    request = urllib.request.Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
        data=data,
        method="POST",
    )
    auth = base64.b64encode(f"{sid}:{token}".encode()).decode()
    request.add_header("Authorization", f"Basic {auth}")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status >= 400:
                raise HTTPException(status_code=502, detail="SMS provider rejected the OTP request")
    except urllib.error.HTTPError as exc:
        detail = "SMS provider rejected the OTP request"
        try:
            payload = json.loads(exc.read().decode())
            detail = payload.get("message") or detail
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach SMS provider") from exc


def _send_fast2sms(to_mobile: str, message: str) -> None:
    _load_env_file()

    api_key = os.getenv("FAST2SMS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Fast2SMS is not configured.")

    numbers = to_mobile[-10:]
    data = urllib.parse.urlencode(
        {
            "route": os.getenv("FAST2SMS_ROUTE", "q"),
            "message": message,
            "language": "english",
            "flash": "0",
            "numbers": numbers,
        }
    ).encode()
    request = urllib.request.Request("https://www.fast2sms.com/dev/bulkV2", data=data, method="POST")
    request.add_header("authorization", api_key)
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode())
            if response.status >= 400 or payload.get("return") is False:
                raise HTTPException(status_code=502, detail=payload.get("message") or "SMS provider rejected the OTP request")
    except urllib.error.HTTPError as exc:
        detail = "SMS provider rejected the OTP request"
        try:
            payload = json.loads(exc.read().decode())
            detail = payload.get("message") or detail
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach SMS provider") from exc


@router.post("/send")
def send_demo_otp(body: OtpSendRequest):
    email = _normalize_email(str(body.email))
    provider = _get_provider()
    code = os.getenv("TEST_OTP_CODE", "123456") if provider in {"test", "demo"} else f"{random.randint(100000, 999999)}"

    _send_otp(email, body.mobile, f"Your Pinesphere demo class OTP is {code}. It is valid for 10 minutes.")
    _otp_store[email] = {"code": code, "expires_at": datetime.utcnow() + timedelta(minutes=10)}

    if provider in {"test", "demo"}:
        message = f"Test OTP enabled. Use code {code}."
    else:
        message = "OTP sent successfully"

    return {"message": message, "email": email, "provider": provider, "expires_in_seconds": 600}


@router.post("/verify")
def verify_demo_otp(body: OtpVerifyRequest):
    email = _normalize_email(str(body.email))
    record = _otp_store.get(email)

    if not record:
        raise HTTPException(status_code=400, detail="Please send OTP first")

    if datetime.utcnow() > record["expires_at"]:
        _otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="OTP expired. Please send a new code")

    if record["code"] != body.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP")

    _otp_store.pop(email, None)
    return {"message": "OTP verified successfully", "email": email}


@router.post("/send-confirmation")
def send_confirmation_email(body: ConfirmationEmailRequest):
    email = _normalize_email(str(body.email))
    message = body.message.strip()
    subject = body.subject.strip() or "Pinesphere ERP - Demo Class Booking Confirmation"

    if not message:
        raise HTTPException(status_code=400, detail="Confirmation message is required")

    _send_email(email, message, subject)
    return {"message": "Confirmation email sent successfully", "email": email}


@router.post("/send-demo-confirmation")
def send_demo_booking_confirmation(body: DemoBookingEmailRequest):
    email = _normalize_email(str(body.email))
    student_name = (body.student_name or "Student").strip()
    course = (body.course or "Demo Class").strip()
    demo_date = (body.demo_date or "Our team will confirm the schedule shortly").strip()
    demo_mode = (body.demo_mode or "Online / Offline as confirmed by counsellor").strip()

    message = f"""Hi {student_name},

Your demo class request has been received successfully.

Course: {course}
Demo Date/Time: {demo_date}
Demo Mode: {demo_mode}

Our admissions team will contact you shortly with the next steps.

Regards,
Pinesphere ERP Team
"""

    _send_email(email, message, "Pinesphere ERP - Demo Class Booking Confirmation")
    return {"message": "Demo class confirmation email sent successfully", "email": email}
