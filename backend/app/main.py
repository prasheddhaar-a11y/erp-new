"""
PINESPHERE ERP
Module      : Backend Platform
File        : main.py
Purpose     : Provides Main backend functionality
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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.attendance import router as attendance_router
from app.api.auth import router as auth_router, users_router, v1_auth_router
from app.api.branches import router as branches_router
from app.api.dashboard import router as dashboard_router
from app.api.lms import router as lms_router
from app.api.v1.branch_admin import router as branch_admin_v1_router
from app.api.v1.trainer import router as trainer_v1_router
from app.db.database import Base, engine
from app.db.schema_compat import ensure_auth_schema_compatibility

# Import models before create_all so SQLAlchemy metadata is fully registered.
from app.models import attendance, branch, lms, token, user, crm, finance, history, admission, batch, trainer  # noqa: F401
from app.models import settings  # noqa: F401
from app.models import franchise, hr, operations  # noqa: F401
from app.models import communication  # noqa: F401

from app.api.crm import router as crm_router
from app.api.finance import router as finance_router
from app.api.history import router as history_router
from app.api.security import router as security_router
from app.api.ai import router as ai_router
from app.api.settings import router as settings_router
from app.api.franchise import router as franchise_router
from app.api.hr import router as hr_router
from app.api.communication import router as communication_router
from app.api.navigation import router as navigation_router
from app.api.operations import router as operations_router
from app.api.profile import router as profile_router
from app.api.reports import router as reports_router
from app.api.role_dashboards import router as role_dashboards_router
from app.api.admissions import router as admissions_router
from app.api.follow_ups import router as follow_ups_router
from app.models import task  # noqa: F401
from app.api.tasks import router as tasks_router
from scripts.seed_superadmin import ensure_demo_users
from app.models import calendar_event  # noqa: F401
from app.api.calendar import router as calendar_router

# Optional feature integrated from main1.py.
# Kept optional so the stable backend does not fail to start if the module
# has not yet been copied into app/api/demo_otp.py.
try:
    from app.api.demo_otp import router as demo_otp_router
except ModuleNotFoundError:
    demo_otp_router = None


# =====================================================
# SECTION: DATABASE INITIALIZATION
# PURPOSE:
# This initializes registered SQLAlchemy models.
# Existing database initialization is preserved.
# =====================================================

Base.metadata.create_all(bind=engine)
ensure_auth_schema_compatibility()
ensure_demo_users()


app = FastAPI(title="Pinesphere ERP", version="1.0.0")


# =====================================================
# SECTION: MIDDLEWARE
# PURPOSE:
# This section runs shared request or response logic.
# Middleware is useful for security, logging, sessions, and cross-cutting behavior.
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://pbp5620t-3000.inc1.devtunnels.ms",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# SECTION: ROUTER REGISTRATION
# PURPOSE:
# This section registers all backend route groups once.
# Existing production routers are preserved and new routers are added safely.
# =====================================================

app.include_router(auth_router)
app.include_router(v1_auth_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(branches_router)
app.include_router(lms_router)
app.include_router(branch_admin_v1_router)
app.include_router(trainer_v1_router)
app.include_router(attendance_router)
app.include_router(crm_router)
app.include_router(finance_router)
app.include_router(history_router)
app.include_router(security_router)
app.include_router(ai_router)
app.include_router(settings_router)
app.include_router(franchise_router)
app.include_router(hr_router)
app.include_router(communication_router)
app.include_router(navigation_router)
app.include_router(operations_router)
app.include_router(profile_router)
app.include_router(reports_router)
app.include_router(role_dashboards_router)
app.include_router(admissions_router)
app.include_router(follow_ups_router)
app.include_router(tasks_router)
app.include_router(calendar_router)

# Integrated from main1.py: demo OTP routes.
# Included only when app.api.demo_otp exists.
if demo_otp_router is not None:
    app.include_router(demo_otp_router)


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Pinesphere ERP API"}
