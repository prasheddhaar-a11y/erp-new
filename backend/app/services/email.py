"""
PINESPHERE ERP
Module      : Backend Platform
File        : email.py
Purpose     : Provides Email business logic
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

from email.message import EmailMessage
from email.utils import parseaddr
from html import escape
import logging
import re
import smtplib
import ssl

from app.core.config import settings


# =====================================================
# SECTION: SERVICES
# PURPOSE:
# This section contains business logic used by routes or other modules.
# Services keep workflows separate from request handling code.
# =====================================================

class EmailDeliveryError(RuntimeError):
    pass


# =====================================================
# SECTION: LOGGING
# PURPOSE:
# This section records useful runtime information for debugging and audits.
# Logs help developers understand what happened during a request or task.
# =====================================================

logger = logging.getLogger(__name__)
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

def validate_email_address(email: str) -> str:
    value = email.strip().lower()
    _, parsed = parseaddr(value)
    if parsed != value or not STRICT_EMAIL_PATTERN.fullmatch(value):
        # =====================================================
        # SECTION: ERROR HANDLING
        # PURPOSE:
        # This section handles expected failures and converts them into useful responses.
        # Good error handling keeps the app stable when something goes wrong.
        # =====================================================

        raise EmailDeliveryError("Invalid email address. Please enter a valid email address.")
    domain = value.rsplit("@", 1)[1]
    if "." not in domain or any(not part for part in domain.split(".")):
        raise EmailDeliveryError("Invalid email address. Please enter a valid email address.")
    return value


def _require_smtp_config() -> tuple[str, int, str, str, str]:
    missing = []
    if not settings.SMTP_HOST:
        missing.append("SMTP_HOST")
    if not settings.SMTP_USERNAME:
        missing.append("SMTP_USERNAME")
    if not settings.SMTP_PASSWORD:
        missing.append("SMTP_PASSWORD")
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    if not from_email:
        missing.append("SMTP_FROM_EMAIL")
    if missing:
        raise EmailDeliveryError(f"SMTP is not configured. Missing: {', '.join(missing)}")
    return settings.SMTP_HOST or "", settings.SMTP_PORT, settings.SMTP_USERNAME or "", settings.SMTP_PASSWORD or "", from_email


def send_email(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    logger.info("Sending email to: %s", to_email)
    try:
        recipient = validate_email_address(to_email)
    except EmailDeliveryError as exc:
        logger.error("Email delivery status for %s: FAILED reason=%s", to_email, exc)
        raise
    host, port, username, password, from_email = _require_smtp_config()
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{from_email}>"
    message["To"] = recipient
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    logger.info("Validated recipient email: %s", recipient)
    try:
        if settings.SMTP_USE_SSL:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=20) as server:
                server.login(username, password)
                refused = server.send_message(message)
                status_code, status_response = server.noop()
                if refused:
                    raise EmailDeliveryError(f"SMTP refused recipient(s): {refused}")
                logger.info("Email delivery status for %s: SUCCESS smtp_status=%s smtp_response=%s", recipient, status_code, status_response)
            return

        with smtplib.SMTP(host, port, timeout=20) as server:
            server.ehlo()
            if settings.SMTP_USE_TLS:
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            server.login(username, password)
            refused = server.send_message(message)
            status_code, status_response = server.noop()
            if refused:
                raise EmailDeliveryError(f"SMTP refused recipient(s): {refused}")
            logger.info("Email delivery status for %s: SUCCESS smtp_status=%s smtp_response=%s", recipient, status_code, status_response)
    except smtplib.SMTPAuthenticationError as exc:
        logger.exception("Email delivery status for %s: FAILED reason=SMTP authentication failed", recipient)
        raise EmailDeliveryError(
            "SMTP authentication failed. Check username, password/app password, and SMTP AUTH settings."
        ) from exc
    except EmailDeliveryError:
        logger.exception("Email delivery status for %s: FAILED", recipient)
        raise
    except Exception as exc:
        logger.exception("Email delivery status for %s: FAILED reason=%s", recipient, exc)
        raise EmailDeliveryError(f"SMTP email delivery failed: {exc}") from exc


def _base_html(title: str, preview: str, body_content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Preview text -->
  <span style="display:none;max-height:0;overflow:hidden;color:transparent;">{escape(preview)}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#1a7a1a;border-radius:10px 10px 0 0;padding:32px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:48px;height:48px;background:#ffffff22;border-radius:12px;display:inline-block;line-height:48px;text-align:center;font-size:24px;margin-bottom:12px;">🌲</div>
                    <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;margin-top:8px;">Pinesphere ERP</div>
                    <div style="color:#a8e6a8;font-size:13px;margin-top:4px;">Institute Management Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              {body_content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8faf8;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                This email was sent by <strong>Pinesphere ERP</strong>. If you were not expecting it, you can safely ignore it.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                &copy; 2026 Pinesphere ERP. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_invite_email(
    *,
    to_email: str,
    full_name: str,
    role_label: str,
    invite_link: str,
    expires_at: str,
    temporary_password: str | None = None,
) -> None:
    safe_name = escape(full_name)
    safe_role = escape(role_label)
    safe_link = escape(invite_link, quote=True)
    safe_expires_at = escape(expires_at)
    safe_password = escape(temporary_password) if temporary_password else None

    password_block = (
        f"""
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;font-size:13px;display:block;margin-bottom:2px;">Temporary Password</span>
            <span style="color:#1e293b;font-size:15px;font-weight:600;font-family:monospace;background:#f8faf8;padding:4px 10px;border-radius:4px;display:inline-block;">{safe_password}</span>
          </td>
        </tr>"""
        if safe_password
        else ""
    )

    setup_note = (
        "<p style='margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;'>"
        "Use your temporary password along with the button below to access your account. "
        "You will be prompted to set a new password on first login."
        "</p>"
        if temporary_password
        else "<p style='margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;'>"
        "Click the button below to set up your password and activate your account. "
        "No password is required — the secure link will guide you through the process."
        "</p>"
    )

    text_body = (
        f"Hello {full_name},\n\n"
        f"You have been invited to Pinesphere ERP as {role_label}.\n\n"
        + (f"Temporary password: {temporary_password}\n\n" if temporary_password else "")
        + f"Activation link: {invite_link}\n"
        f"This invite expires at: {expires_at}\n\n"
        "If you were not expecting this invitation, please contact the institute administrator."
    )

    body_content = f"""
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;">You're invited!</h1>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;">Welcome to Pinesphere ERP</p>

      <p style="margin:0 0 20px;color:#1e293b;font-size:15px;line-height:1.6;">
        Hello <strong>{safe_name}</strong>,<br/>
        You have been granted access to <strong>Pinesphere ERP</strong>. Your account is ready and waiting for you.
      </p>

      <!-- Info card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
            <span style="color:#64748b;font-size:13px;display:block;margin-bottom:2px;">Assigned Role</span>
            <span style="color:#1e293b;font-size:15px;font-weight:600;">{safe_role}</span>
          </td>
        </tr>
        {password_block}
        <tr>
          <td style="padding:12px 16px;">
            <span style="color:#64748b;font-size:13px;display:block;margin-bottom:2px;">Invite Expires</span>
            <span style="color:#dc2626;font-size:14px;font-weight:500;">{safe_expires_at}</span>
          </td>
        </tr>
      </table>

      {setup_note}

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#16a34a;border-radius:8px;">
            <a href="{safe_link}"
               style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Accept Invitation &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;">
        <a href="{safe_link}" style="color:#16a34a;font-size:12px;">{safe_link}</a>
      </p>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;" />
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
        If you were not expecting this invitation, no action is required. Contact your institute administrator if you have concerns.
      </p>
    """

    html_body = _base_html("Your Pinesphere ERP Invitation", f"You've been invited as {role_label} — accept your invite inside.", body_content)
    send_email(to_email, "You're invited to Pinesphere ERP", text_body, html_body)


def send_password_reset_email(
    *,
    to_email: str,
    full_name: str,
    reset_link: str,
    expires_in_minutes: int = 30,
) -> None:
    safe_name = escape(full_name)
    safe_link = escape(reset_link, quote=True)

    text_body = (
        f"Hello {full_name},\n\n"
        "We received a request to reset your Pinesphere ERP password.\n\n"
        f"Reset link: {reset_link}\n"
        f"This link expires in {expires_in_minutes} minutes.\n\n"
        "If you did not request this, ignore this email — your password won't change."
    )

    body_content = f"""
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;">Password Reset</h1>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;">Requested for your Pinesphere ERP account</p>

      <p style="margin:0 0 20px;color:#1e293b;font-size:15px;line-height:1.6;">
        Hello <strong>{safe_name}</strong>,<br/>
        We received a request to reset the password for your account. Click the button below to choose a new password.
      </p>

      <!-- Expiry notice -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0;color:#9a3412;font-size:13px;font-weight:600;">
              ⏱ This link expires in {expires_in_minutes} minutes
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#16a34a;border-radius:8px;">
            <a href="{safe_link}"
               style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Reset My Password &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;">
        <a href="{safe_link}" style="color:#16a34a;font-size:12px;">{safe_link}</a>
      </p>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;" />
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
        If you did not request a password reset, you can safely ignore this email. Your password will not change.
      </p>
    """

    html_body = _base_html("Reset Your Password — Pinesphere ERP", "Reset your Pinesphere ERP password — link expires soon.", body_content)
    send_email(to_email, "Reset your Pinesphere ERP password", text_body, html_body)


def send_auth_otp_email(
    *,
    to_email: str,
    full_name: str,
    otp: str,
    purpose_label: str,
    expires_in_minutes: int,
) -> None:
    safe_name = escape(full_name)
    safe_otp = escape(otp)
    safe_purpose = escape(purpose_label)
    text_body = (
        f"Hello {full_name},\n\n"
        f"Your Pinesphere ERP {purpose_label} OTP is: {otp}\n"
        f"This code expires in {expires_in_minutes} minutes.\n\n"
        "If you did not request this, ignore this email."
    )
    body_content = f"""
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;">Pinesphere OTP</h1>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;">{safe_purpose}</p>

      <p style="margin:0 0 18px;color:#1e293b;font-size:15px;line-height:1.6;">
        Hello <strong>{safe_name}</strong>, use this one-time code to continue.
      </p>

      <div style="margin:0 0 24px;padding:18px 22px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:30px;font-weight:800;letter-spacing:6px;text-align:center;">
        {safe_otp}
      </div>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
        This code expires in {expires_in_minutes} minutes. Never share it with anyone.
      </p>
    """
    html_body = _base_html("Your Pinesphere ERP OTP", f"Your {purpose_label} OTP expires soon.", body_content)
    send_email(to_email, f"Pinesphere ERP {purpose_label} OTP", text_body, html_body)


def send_verification_email(
    *,
    to_email: str,
    full_name: str,
    verification_link: str,
) -> None:
    safe_name = escape(full_name)
    safe_link = escape(verification_link, quote=True)

    text_body = (
        f"Hello {full_name},\n\n"
        "Please verify your email address for Pinesphere ERP.\n\n"
        f"Verification link: {verification_link}\n\n"
        "This link expires in 24 hours.\n\n"
        "If you did not create an account, please ignore this email."
    )

    body_content = f"""
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;">Verify Your Email</h1>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;">One last step to activate your Pinesphere ERP account</p>

      <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.6;">
        Hello <strong>{safe_name}</strong>,<br/>
        Thank you for joining Pinesphere ERP. Please verify your email address to complete your account setup.
      </p>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#16a34a;border-radius:8px;">
            <a href="{safe_link}"
               style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
              Verify Email Address &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Button not working? Copy and paste this link into your browser:</p>
      <p style="margin:0;word-break:break-all;">
        <a href="{safe_link}" style="color:#16a34a;font-size:12px;">{safe_link}</a>
      </p>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;" />
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
        This link expires in 24 hours. If you did not create a Pinesphere ERP account, no action is required.
      </p>
    """

    html_body = _base_html("Verify Your Email — Pinesphere ERP", "Verify your email to activate your Pinesphere ERP account.", body_content)
    send_email(to_email, "Verify your Pinesphere ERP email address", text_body, html_body)


def send_admission_email(
    *,
    to_email: str,
    full_name: str,
    course_interest: str,
) -> None:
    safe_name = escape(full_name)
    safe_course = escape(course_interest) if course_interest else "our courses"

    text_body = (
        f"Hello {full_name},\n\n"
        f"Your admission inquiry for {course_interest if course_interest else 'our courses'} has been successfully registered at Pinesphere ERP.\n\n"
        "Our counselling team will review your details and reach out to you shortly with the next steps.\n\n"
        "Thank you for choosing Pinesphere ERP!"
    )

    body_content = f"""
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;">Admission Registered</h1>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;">Your details have been received successfully.</p>

      <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.6;">
        Hello <strong>{safe_name}</strong>,<br/>
        We're thrilled to confirm that your admission inquiry for <strong>{safe_course}</strong> has been successfully registered in our system.
      </p>

      <p style="margin:0 0 24px;color:#1e293b;font-size:15px;line-height:1.6;">
        Our counselling team is reviewing your profile and will contact you soon with the next steps regarding your fee plan and enrollment process.
      </p>

      <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;" />
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
        If you have any questions, feel free to contact your institute administrator.
      </p>
    """

    html_body = _base_html("Admission Registered — Pinesphere ERP", "Your admission inquiry has been received.", body_content)
    send_email(to_email, f"Admission Registered Successfully - {full_name}", text_body, html_body)


