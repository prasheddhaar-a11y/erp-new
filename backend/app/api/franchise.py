"""
PINESPHERE ERP
Module      : Backend Platform
File        : franchise.py
Purpose     : Defines Franchise API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/api/franchise.py
# PURPOSE: Super Admin franchise analytics, royalty, compliance, agreement, alert, and realtime endpoints.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import date, datetime
import asyncio
import uuid

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.core.security import decode_token
from app.db.database import SessionLocal, get_db
from app.models.user import User
from app.models.attendance import AttendanceRecord
from app.models.crm import Lead
from app.models.finance import Payment
from app.models.franchise import (
    Franchise,
    FranchiseAgreement,
    FranchiseComplianceCheck,
    FranchiseNotification,
    FranchiseRoyaltyLedger,
)
from app.schemas.franchise import (
    FranchiseAgreementCreate,
    FranchiseAgreementItem,
    FranchiseAiInsight,
    FranchiseAlertCreate,
    FranchiseAlertItem,
    FranchiseChartPoint,
    FranchiseComplianceCreate,
    FranchiseComplianceMetric,
    FranchiseCreate,
    FranchiseDashboardResponse,
    FranchiseDirectoryRow,
    FranchiseKpi,
    FranchiseResponse,
    FranchiseRoyaltyCreate,
)

router = APIRouter(prefix="/api/franchise", tags=["Franchise"])


class FranchiseWebSocketManager:
    # =====================================================
    # SECTION: HELPER FUNCTIONS
    # PURPOSE:
    # This section contains small reusable utilities used by the file.
    # Helpers keep repeated logic in one clear place.
    # =====================================================

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)


manager = FranchiseWebSocketManager()


def _amount_value(value: str | None) -> float:
    if not value:
        return 0
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return 0


def _currency_lakh(value: float) -> str:
    return f"Rs {value / 100000:.1f}L"


def _month_label(period: str | None, fallback: datetime | None = None) -> str:
    if period:
        try:
            return datetime.strptime(period[:7], "%Y-%m").strftime("%b")
        except ValueError:
            return period
    return (fallback or datetime.utcnow()).strftime("%b")


def _relative_time(value: datetime | None) -> str:
    if not value:
        return "No activity"
    seconds = max(0, int((datetime.utcnow() - value).total_seconds()))
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hr ago"
    return f"{hours // 24} d ago"


def _branch_ids(franchise: Franchise) -> list[str]:
    raw_ids = franchise.linked_branch_ids or []
    return [str(branch_id) for branch_id in raw_ids if branch_id]


def _franchise_ids_for(db: Session, current_user) -> set[str] | None:
    if current_user.role == UserRole.SUPER_ADMIN:
        return None
    if current_user.franchise_id:
        return {current_user.franchise_id}
    return {
        franchise_id
        for (franchise_id,) in db.query(Franchise.id).filter(Franchise.owner_email == current_user.email).all()
    }


def _filter_franchise_ids(query, column, franchise_ids: set[str] | None):
    return query if franchise_ids is None else query.filter(column.in_(franchise_ids))


def _students_for_branches(db: Session, branch_ids: list[str]) -> list[User]:
    if not branch_ids:
        return []
    return db.query(User).filter(User.branch_id.in_(branch_ids), User.role == UserRole.STUDENT).all()


def _payments_for_students(db: Session, students: list[User]) -> list[Payment]:
    student_ids = [student.id for student in students]
    if not student_ids:
        return []
    return db.query(Payment).filter(Payment.student_id.in_(student_ids)).all()


def _latest_agreement(db: Session, franchise_id: str) -> FranchiseAgreement | None:
    return (
        db.query(FranchiseAgreement)
        .filter(FranchiseAgreement.franchise_id == franchise_id)
        .order_by(FranchiseAgreement.updated_at.desc(), FranchiseAgreement.created_at.desc())
        .first()
    )


def _compliance_score(db: Session, franchise_id: str) -> int:
    checks = db.query(FranchiseComplianceCheck).filter(FranchiseComplianceCheck.franchise_id == franchise_id).all()
    if not checks:
        return 0
    return round(sum(check.score or 0 for check in checks) / len(checks))


def _ledger_revenue(db: Session, franchise: Franchise) -> tuple[float, float]:
    ledgers = db.query(FranchiseRoyaltyLedger).filter(FranchiseRoyaltyLedger.franchise_id == franchise.id).all()
    gross = sum(ledger.gross_revenue or 0 for ledger in ledgers)
    royalty = sum(ledger.royalty_amount or 0 for ledger in ledgers)
    return gross, royalty


def _computed_revenue(db: Session, franchise: Franchise, students: list[User]) -> tuple[float, float]:
    ledger_gross, ledger_royalty = _ledger_revenue(db, franchise)
    if ledger_gross or ledger_royalty:
        return ledger_gross, ledger_royalty
    gross = sum(_amount_value(payment.amount) for payment in _payments_for_students(db, students))
    return gross, gross * float(franchise.royalty_percent or 0) / 100


def _health(score: int, agreement: FranchiseAgreement | None, unpaid_royalties: int) -> str:
    if score and score < 75:
        return "critical"
    if agreement and agreement.status not in {"active", "Active"}:
        return "warning"
    if unpaid_royalties:
        return "warning"
    if score and score < 85:
        return "warning"
    return "healthy"


def _directory_rows(db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseDirectoryRow]:
    rows: list[FranchiseDirectoryRow] = []
    franchise_query = _filter_franchise_ids(db.query(Franchise), Franchise.id, franchise_ids)
    franchises = franchise_query.order_by(Franchise.updated_at.desc(), Franchise.created_at.desc()).all()

    for franchise in franchises:
        branch_ids = _branch_ids(franchise)
        students = _students_for_branches(db, branch_ids)
        gross_revenue, _ = _computed_revenue(db, franchise, students)
        agreement = _latest_agreement(db, franchise.id)
        compliance_score = _compliance_score(db, franchise.id)
        unpaid_royalties = (
            db.query(FranchiseRoyaltyLedger)
            .filter(FranchiseRoyaltyLedger.franchise_id == franchise.id, FranchiseRoyaltyLedger.payment_status.in_(["pending", "overdue"]))
            .count()
        )
        latest_notification = (
            db.query(FranchiseNotification)
            .filter(FranchiseNotification.franchise_id == franchise.id)
            .order_by(FranchiseNotification.created_at.desc())
            .first()
        )
        last_activity_at = latest_notification.created_at if latest_notification else franchise.updated_at or franchise.created_at

        rows.append(
            FranchiseDirectoryRow(
                id=franchise.id,
                name=franchise.name,
                owner=franchise.owner_name,
                linked_branches=len(branch_ids),
                students=len(students),
                revenue=round(gross_revenue, 2),
                royalty_percent=float(franchise.royalty_percent or 0),
                compliance_score=compliance_score,
                agreement_status=agreement.status if agreement else "Not Uploaded",
                last_activity=_relative_time(last_activity_at),
                health=_health(compliance_score, agreement, unpaid_royalties),
            )
        )
    return rows


def _kpis(rows: list[FranchiseDirectoryRow], db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseKpi]:
    total_revenue = sum(row.revenue for row in rows)
    royalty_revenue = sum(row.revenue * row.royalty_percent / 100 for row in rows)
    active_branches = sum(row.linked_branches for row in rows)
    pending_renewals = len([row for row in rows if row.agreement_status not in {"active", "Active"}])
    pending_approvals = len([row for row in rows if row.health != "healthy"])
    compliance_values = [row.compliance_score for row in rows if row.compliance_score]
    avg_compliance = round(sum(compliance_values) / len(compliance_values)) if compliance_values else 0
    overdue_query = db.query(FranchiseRoyaltyLedger).filter(FranchiseRoyaltyLedger.payment_status == "overdue")
    overdue = _filter_franchise_ids(overdue_query, FranchiseRoyaltyLedger.franchise_id, franchise_ids).count()
    compliance_status = "healthy" if avg_compliance >= 90 else "warning" if avg_compliance >= 75 else "critical"

    return [
        FranchiseKpi(key="franchises", label="Total Franchises", value=str(len(rows)), trend="Live DB", status="healthy" if rows else "info", series=[len(rows)]),
        FranchiseKpi(key="branches", label="Active Branches", value=str(active_branches), trend="Linked branches", status="healthy" if active_branches else "info", series=[active_branches]),
        FranchiseKpi(key="royalty", label="Monthly Royalty Revenue", value=_currency_lakh(royalty_revenue), trend=f"{overdue} overdue", status="critical" if overdue else "healthy", series=[round(royalty_revenue / 100000)]),
        FranchiseKpi(key="renewals", label="Pending Renewals", value=str(pending_renewals), trend="Agreement queue", status="warning" if pending_renewals else "healthy", series=[pending_renewals]),
        FranchiseKpi(key="compliance", label="Compliance Score", value=f"{avg_compliance}%", trend="Average checks", status=compliance_status, series=[avg_compliance]),
        FranchiseKpi(key="approvals", label="Pending Approvals", value=str(pending_approvals), trend="Risk review", status="warning" if pending_approvals else "healthy", series=[pending_approvals]),
    ]


def _alerts(db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseAlertItem]:
    stored_query = _filter_franchise_ids(db.query(FranchiseNotification), FranchiseNotification.franchise_id, franchise_ids)
    stored = stored_query.order_by(FranchiseNotification.created_at.desc()).limit(20).all()
    alerts = [
        FranchiseAlertItem(
            id=notification.id,
            title=notification.title,
            detail=notification.detail,
            severity=notification.severity,
            timestamp=_relative_time(notification.created_at),
            action=notification.action or "Review",
        )
        for notification in stored
    ]

    today = date.today()
    agreements = _filter_franchise_ids(db.query(FranchiseAgreement), FranchiseAgreement.franchise_id, franchise_ids).all()
    franchises = {
        franchise.id: franchise.name
        for franchise in _filter_franchise_ids(db.query(Franchise), Franchise.id, franchise_ids).all()
    }
    for agreement in agreements:
        if not agreement.renewal_date:
            continue
        try:
            renewal_date = datetime.strptime(agreement.renewal_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        days_left = (renewal_date - today).days
        if 0 <= days_left <= 30:
            alerts.append(
                FranchiseAlertItem(
                    id=f"renewal-{agreement.id}",
                    title="Agreement expiring soon",
                    detail=f"{franchises.get(agreement.franchise_id, 'Franchise')} renews in {days_left} days.",
                    severity="warning",
                    timestamp="Live",
                    action="Renew",
                )
            )

    overdue_query = db.query(FranchiseRoyaltyLedger).filter(FranchiseRoyaltyLedger.payment_status == "overdue")
    overdue = _filter_franchise_ids(overdue_query, FranchiseRoyaltyLedger.franchise_id, franchise_ids).all()
    for ledger in overdue:
        alerts.append(
            FranchiseAlertItem(
                id=f"royalty-{ledger.id}",
                title="Royalty payment overdue",
                detail=f"{franchises.get(ledger.franchise_id, 'Franchise')} has overdue royalty for {ledger.period}.",
                severity="critical",
                timestamp="Live",
                action="Escalate",
            )
        )
    return alerts[:20]


def _charts(db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseChartPoint]:
    ledger_query = _filter_franchise_ids(db.query(FranchiseRoyaltyLedger), FranchiseRoyaltyLedger.franchise_id, franchise_ids)
    ledgers = ledger_query.order_by(FranchiseRoyaltyLedger.period.asc()).all()
    grouped: dict[str, dict[str, float]] = {}
    for ledger in ledgers:
        label = _month_label(ledger.period, ledger.created_at)
        grouped.setdefault(label, {"revenue": 0, "royalty": 0, "students": 0, "attendance": 0, "conversion": 0})
        grouped[label]["revenue"] += ledger.gross_revenue or 0
        grouped[label]["royalty"] += ledger.royalty_amount or 0

    franchises = _filter_franchise_ids(db.query(Franchise), Franchise.id, franchise_ids).all()
    branch_ids = {branch_id for franchise in franchises for branch_id in _branch_ids(franchise)}
    students = _students_for_branches(db, list(branch_ids))
    student_ids = [student.id for student in students]
    total_students = len(students)
    attendance_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id.in_(student_ids)).all() if student_ids else []
    attended = len([record for record in attendance_records if record.status in {"present", "late"}])
    attendance = round((attended / len(attendance_records)) * 100, 2) if attendance_records else 0
    leads = []
    converted = len([lead for lead in leads if lead.stage in {"converted", "admitted", "enrolled"}])
    conversion = round((converted / len(leads)) * 100, 2) if leads else 0

    if not grouped:
        rows = _directory_rows(db, franchise_ids)
        total_revenue = sum(row.revenue for row in rows)
        total_royalty = sum(row.revenue * row.royalty_percent / 100 for row in rows)
        if not total_revenue and not total_royalty:
            return []
        grouped[datetime.utcnow().strftime("%b")] = {
            "revenue": total_revenue,
            "royalty": total_royalty,
            "students": total_students,
            "attendance": attendance,
            "conversion": conversion,
        }

    return [
        FranchiseChartPoint(
            label=label,
            revenue=round(values["revenue"] / 100000, 2),
            royalty=round(values["royalty"] / 100000, 2),
            students=total_students,
            attendance=attendance,
            conversion=conversion,
        )
        for label, values in grouped.items()
    ]


def _compliance(db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseComplianceMetric]:
    checks = _filter_franchise_ids(db.query(FranchiseComplianceCheck), FranchiseComplianceCheck.franchise_id, franchise_ids).all()
    grouped: dict[str, list[FranchiseComplianceCheck]] = {}
    for check in checks:
        grouped.setdefault(check.category, []).append(check)

    metrics: list[FranchiseComplianceMetric] = []
    for category, category_checks in grouped.items():
        score = round(sum(check.score or 0 for check in category_checks) / len(category_checks))
        open_count = len([check for check in category_checks if check.status not in {"closed", "completed", "passed"}])
        metrics.append(
            FranchiseComplianceMetric(
                label=category,
                value=score,
                insight=f"{open_count} open checks across {len(category_checks)} records.",
            )
        )
    return sorted(metrics, key=lambda metric: metric.label)


def _agreements(db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseAgreementItem]:
    franchises = {
        franchise.id: franchise.name
        for franchise in _filter_franchise_ids(db.query(Franchise), Franchise.id, franchise_ids).all()
    }
    agreement_query = _filter_franchise_ids(db.query(FranchiseAgreement), FranchiseAgreement.franchise_id, franchise_ids)
    agreements = agreement_query.order_by(FranchiseAgreement.updated_at.desc(), FranchiseAgreement.created_at.desc()).all()
    return [
        FranchiseAgreementItem(
            id=agreement.id,
            franchise=franchises.get(agreement.franchise_id, "Unknown franchise"),
            status=agreement.status,
            renewal_date=agreement.renewal_date or "",
            duration=agreement.duration or "",
            pending_signatures=agreement.pending_signatures or 0,
            uploaded_documents=agreement.uploaded_documents or 0,
            kyc_status="Verified" if agreement.kyc_verified else "Pending",
            gst_status="Verified" if agreement.gst_verified else "Pending",
        )
        for agreement in agreements
    ]


def _insights(rows: list[FranchiseDirectoryRow], db: Session, franchise_ids: set[str] | None = None) -> list[FranchiseAiInsight]:
    insights: list[FranchiseAiInsight] = []
    if not rows:
        return insights

    top_revenue = max(rows, key=lambda row: row.revenue)
    if top_revenue.revenue:
        insights.append(
            FranchiseAiInsight(
                id=f"revenue-{top_revenue.id}",
                title=f"{top_revenue.name} leads royalty contribution",
                detail=f"{_currency_lakh(top_revenue.revenue)} gross revenue is currently mapped to this franchise.",
                confidence=90,
                recommendation="Review expansion capacity",
                direction="up",
            )
        )

    lowest_compliance = min(rows, key=lambda row: row.compliance_score or 101)
    if lowest_compliance.compliance_score and lowest_compliance.compliance_score < 85:
        insights.append(
            FranchiseAiInsight(
                id=f"compliance-{lowest_compliance.id}",
                title=f"{lowest_compliance.name} has compliance risk",
                detail=f"Current score is {lowest_compliance.compliance_score}%, below the franchise standard.",
                confidence=86,
                recommendation="Schedule compliance review",
                direction="risk",
            )
        )

    overdue_query = db.query(FranchiseRoyaltyLedger).filter(FranchiseRoyaltyLedger.payment_status == "overdue")
    overdue_count = _filter_franchise_ids(overdue_query, FranchiseRoyaltyLedger.franchise_id, franchise_ids).count()
    if overdue_count:
        insights.append(
            FranchiseAiInsight(
                id="royalty-overdue",
                title=f"Royalty collection delayed in {overdue_count} records",
                detail="Overdue royalty records are affecting current collection visibility.",
                confidence=84,
                recommendation="Send payment reminder",
                direction="down",
            )
        )
    return insights


def _build_dashboard(db: Session, franchise_ids: set[str] | None = None) -> FranchiseDashboardResponse:
    rows = _directory_rows(db, franchise_ids)
    return FranchiseDashboardResponse(
        last_sync_time=datetime.utcnow().isoformat(),
        system_status="Live DB",
        active_franchises=len([row for row in rows if row.health != "critical"]),
        kpis=_kpis(rows, db, franchise_ids),
        franchises=rows,
        alerts=_alerts(db, franchise_ids),
        charts=_charts(db, franchise_ids),
        compliance=_compliance(db, franchise_ids),
        agreements=_agreements(db, franchise_ids),
        insights=_insights(rows, db, franchise_ids),
    )


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/analytics", response_model=FranchiseDashboardResponse)
def franchise_analytics(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _build_dashboard(db, _franchise_ids_for(db, current_user))


@router.get("/franchises", response_model=list[FranchiseResponse])
def list_franchises(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    franchise_ids = _franchise_ids_for(db, current_user)
    return _filter_franchise_ids(db.query(Franchise), Franchise.id, franchise_ids).order_by(Franchise.name.asc()).all()


@router.post("/franchises", response_model=FranchiseResponse)
async def create_franchise(body: FranchiseCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    franchise = Franchise(
        id=str(uuid.uuid4()),
        name=body.name,
        owner_name=body.owner_name,
        owner_email=body.owner_email,
        owner_phone=body.owner_phone,
        city=body.city,
        status=body.status,
        royalty_percent=body.royalty_percent,
        linked_branch_ids=body.linked_branch_ids,
    )
    db.add(franchise)
    db.commit()
    db.refresh(franchise)
    await manager_send_all()
    return franchise


@router.get("/revenue", response_model=list[FranchiseChartPoint])
def franchise_revenue(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _charts(db, _franchise_ids_for(db, current_user))


@router.post("/revenue", response_model=FranchiseChartPoint)
async def add_royalty_record(body: FranchiseRoyaltyCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    franchise = db.query(Franchise).filter(Franchise.id == body.franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    ledger = FranchiseRoyaltyLedger(
        franchise_id=body.franchise_id,
        period=body.period,
        gross_revenue=body.gross_revenue,
        royalty_percent=body.royalty_percent,
        royalty_amount=body.gross_revenue * body.royalty_percent / 100,
        payment_status=body.payment_status,
        due_date=body.due_date,
    )
    db.add(ledger)
    db.commit()
    await manager_send_all()
    return _charts(db)[-1]


@router.get("/compliance", response_model=list[FranchiseComplianceMetric])
def franchise_compliance(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _compliance(db, _franchise_ids_for(db, current_user))


@router.post("/compliance", response_model=FranchiseComplianceMetric)
async def add_compliance_check(body: FranchiseComplianceCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    franchise = db.query(Franchise).filter(Franchise.id == body.franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    db.add(
        FranchiseComplianceCheck(
            franchise_id=body.franchise_id,
            category=body.category,
            score=body.score,
            status=body.status,
            notes=body.notes,
        )
    )
    db.commit()
    await manager_send_all()
    matching = [metric for metric in _compliance(db) if metric.label == body.category]
    return matching[0]


@router.get("/alerts", response_model=list[FranchiseAlertItem])
def franchise_alerts(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _alerts(db, _franchise_ids_for(db, current_user))


@router.post("/alerts", response_model=FranchiseAlertItem)
async def create_alert(body: FranchiseAlertCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    notification = FranchiseNotification(**body.dict())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    await manager_send_all()
    return FranchiseAlertItem(
        id=notification.id,
        title=notification.title,
        detail=notification.detail,
        severity=notification.severity,
        timestamp=_relative_time(notification.created_at),
        action=notification.action or "Review",
    )


@router.get("/agreements", response_model=list[FranchiseAgreementItem])
def franchise_agreements(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _agreements(db, _franchise_ids_for(db, current_user))


@router.post("/agreements", response_model=FranchiseAgreementItem)
async def create_agreement(body: FranchiseAgreementCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    franchise = db.query(Franchise).filter(Franchise.id == body.franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    agreement = FranchiseAgreement(**body.dict())
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
    await manager_send_all()
    return _agreements(db)[0]


@router.get("/realtime", response_model=FranchiseDashboardResponse)
def franchise_realtime(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _build_dashboard(db, _franchise_ids_for(db, current_user))


async def manager_send_all():
    disconnected: list[WebSocket] = []
    for connection in manager.active_connections:
        db = SessionLocal()
        try:
            await connection.send_json({"type": "franchise.analytics.updated"})
        except RuntimeError:
            disconnected.append(connection)
        finally:
            db.close()
    for connection in disconnected:
        manager.disconnect(connection)


@router.websocket("/realtime")
async def franchise_realtime_socket(websocket: WebSocket):
    db = SessionLocal()
    try:
        payload = decode_token(websocket.query_params.get("token", ""))
        current_user = db.query(User).filter(User.id == payload.get("sub")).first()
        if not current_user or not current_user.is_active or current_user.role not in {UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER}:
            await websocket.close(code=1008)
            return
        franchise_ids = _franchise_ids_for(db, current_user)
        await manager.connect(websocket)
        while True:
            await websocket.send_json(_build_dashboard(db, franchise_ids).dict())
            await asyncio.sleep(5)
    except (ValueError, WebSocketDisconnect):
        manager.disconnect(websocket)
    finally:
        db.close()
