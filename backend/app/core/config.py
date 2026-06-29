"""
PINESPHERE ERP
Module      : Backend Platform
File        : config.py
Purpose     : Provides Config backend functionality
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

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # =====================================================
    # CORE APPLICATION SETTINGS
    # =====================================================
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # =====================================================
    # AUTHENTICATION / TOKEN SETTINGS
    # =====================================================
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    KEEP_ME_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    INVITE_TOKEN_EXPIRE_HOURS: int = 48
    AUTH_OTP_EXPIRE_MINUTES: int = 10
    AUTH_OTP_RESEND_COOLDOWN_SECONDS: int = 60
    AUTH_DEBUG_OTP: bool = False
    DEFAULT_REGISTRATION_ROLE: str = "student"

    # =====================================================
    # FRONTEND / CORS RELATED SETTINGS
    # =====================================================
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    FRONTEND_DEVTUNNEL_URL:str="https://pbp5620t-3000.inc1.devtunnels.ms"

    # =====================================================
    # EMAIL / SMTP SETTINGS
    # Existing production email configuration is preserved.
    # =====================================================
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_FROM_NAME: str = "Pinesphere ERP"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    # =====================================================
    # GOOGLE OAUTH SETTINGS
    # =====================================================
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = None
    GOOGLE_OAUTH_STATE_EXPIRE_MINUTES: int = 10

    # =====================================================
    # SMS / OTP PROVIDER SETTINGS
    # Integrated from config1.py for demo OTP / SMS support.
    # =====================================================
    SMS_PROVIDER: str = "demo"
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None
    FAST2SMS_API_KEY: str | None = None
    FAST2SMS_ROUTE: str = "q"

    # Pydantic v2 settings configuration.
    # Keeps existing env lookup paths and safely ignores extra environment keys.
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        extra="ignore",
    )


settings = Settings()
