"""
PINESPHERE ERP
Module      : Communication Module
File        : communication.py
Purpose     : Communication APIs for counsellor communication center
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from __future__ import annotations

from collections import Counter, defaultdict
import csv
from datetime import date, datetime, timedelta
from io import BytesIO
import uuid
import zipfile
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.communication import CommunicationAnalytics, CommunicationLog, CommunicationTemplate
from app.models.user import User
from app.schemas.communication import (
    CommunicationAnalyticsResponse,
    CommunicationLogCreate,
    CommunicationLogResponse,
    CommunicationLogUpdate,
    CommunicationTemplateCreate,
    CommunicationTemplateResponse,
    CommunicationTemplateUpdate,
)

router = APIRouter(prefix="/communications", tags=["Communications"])


def _now() -> datetime:
    return datetime.utcnow()


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            return None


def _seed_templates(db: Session) -> None:
    if db.query(CommunicationTemplate).count():
        return
    templates = [
        CommunicationTemplate(
            id="tmpl-1001",
            name="Welcome Call",
            channel="call",
            category="Lead Nurture",
            subject="Welcome to Pinesphere ERP",
            body="Warm welcome call script for new leads.",
            is_active=True,
            usage_count=18,
        ),
        CommunicationTemplate(
            id="tmpl-1002",
            name="Demo Reminder",
            channel="whatsapp",
            category="Follow-up",
            subject="Demo reminder",
            body="Hi {{name}}, your demo is scheduled for today.",
            is_active=True,
            usage_count=36,
        ),
        CommunicationTemplate(
            id="tmpl-1003",
            name="Fee Update Email",
            channel="email",
            category="Finance",
            subject="Fee update and onboarding details",
            body="Please review the attached onboarding and fee schedule.",
            is_active=True,
            usage_count=12,
        ),
    ]
    db.add_all(templates)
    db.commit()


def _seed_logs(db: Session) -> None:
    templates = db.query(CommunicationTemplate).all()
    template_map = {template.channel: template for template in templates}
    sample_logs = [
        CommunicationLog(
            id="log-1001",
            channel="call",
            recipient_name="Meera Nair",
            recipient_phone="+91 98765 43210",
            subject="Admission follow-up",
            message="Discuss course selection and weekend batch.",
            status="sent",
            template_id=template_map.get("call").id if template_map.get("call") else None,
            branch_id="kochi",
            sent_at=_now() - timedelta(hours=2),
            delivered_at=_now() - timedelta(hours=1, minutes=55),
        ),
        CommunicationLog(
            id="log-1002",
            channel="whatsapp",
            recipient_name="Aarav Sharma",
            recipient_phone="+91 98470 11520",
            subject="Batch reminder",
            message="Your evening batch starts tomorrow.",
            status="delivered",
            template_id=template_map.get("whatsapp").id if template_map.get("whatsapp") else None,
            branch_id="madurai",
            sent_at=_now() - timedelta(hours=4),
            delivered_at=_now() - timedelta(hours=3, minutes=40),
        ),
        CommunicationLog(
            id="log-1003",
            channel="email",
            recipient_name="Nandini R",
            recipient_email="nandini.r@example.com",
            subject="Course onboarding",
            message="Your full onboarding kit is attached.",
            status="read",
            template_id=template_map.get("email").id if template_map.get("email") else None,
            branch_id="chennai",
            sent_at=_now() - timedelta(days=1, hours=1),
            delivered_at=_now() - timedelta(days=1),
            read_at=_now() - timedelta(days=1, minutes=-35),
        ),
        CommunicationLog(
            id="log-1004",
            channel="sms",
            recipient_name="Imran Ali",
            recipient_phone="+91 90123 45678",
            subject="Payment reminder",
            message="Friendly reminder to complete the next installment.",
            status="failed",
            branch_id="coimbatore",
            failed_reason="Network unavailable",
            sent_at=_now() - timedelta(days=1, hours=4),
        ),
    ]
    branch_aliases = {"Kochi": "kochi", "Chennai": "chennai", "Madurai": "madurai", "Coimbatore": "coimbatore"}
    for old_value, new_value in branch_aliases.items():
        db.query(CommunicationLog).filter(CommunicationLog.branch_id == old_value).update({CommunicationLog.branch_id: new_value})
        db.query(CommunicationTemplate).filter(CommunicationTemplate.branch_id == old_value).update({CommunicationTemplate.branch_id: new_value})
        db.query(CommunicationAnalytics).filter(CommunicationAnalytics.branch_id == old_value).update({CommunicationAnalytics.branch_id: new_value})

    for sample in sample_logs:
        existing = db.query(CommunicationLog).filter(CommunicationLog.id == sample.id).first()
        if existing:
            existing.branch_id = sample.branch_id
            existing.channel = sample.channel
            existing.recipient_name = sample.recipient_name
            existing.status = sample.status
            existing.subject = sample.subject
            existing.message = sample.message
        else:
            db.add(sample)
    db.commit()


def _serialize_template(template: CommunicationTemplate) -> CommunicationTemplateResponse:
    return CommunicationTemplateResponse(
        id=template.id,
        name=template.name,
        channel=template.channel,
        category=template.category,
        subject=template.subject,
        body=template.body,
        branch_id=template.branch_id,
        created_by=template.created_by,
        is_active=bool(template.is_active),
        usage_count=int(template.usage_count or 0),
        created_at=template.created_at or _now(),
        updated_at=template.updated_at or _now(),
    )


def _serialize_log(log: CommunicationLog) -> CommunicationLogResponse:
    timeline = [{"label": "Created", "value": (log.created_at or _now()).isoformat()}]
    if log.sent_at:
        timeline.append({"label": "Sent", "value": log.sent_at.isoformat()})
    if log.delivered_at:
        timeline.append({"label": "Delivered", "value": log.delivered_at.isoformat()})
    if log.read_at:
        timeline.append({"label": "Read", "value": log.read_at.isoformat()})
    if log.failed_reason:
        timeline.append({"label": "Failed", "value": log.failed_reason})

    return CommunicationLogResponse(
        id=log.id,
        channel=log.channel,
        recipient_name=log.recipient_name,
        recipient_phone=log.recipient_phone,
        recipient_email=log.recipient_email,
        subject=log.subject,
        message=log.message,
        status=log.status,
        related_type=log.related_type,
        related_id=log.related_id,
        template_id=log.template_id,
        template_name=log.template.name if log.template else None,
        branch_id=log.branch_id,
        counsellor_id=log.counsellor_id,
        initiated_by=log.initiated_by,
        notes=log.notes,
        failed_reason=log.failed_reason,
        sent_at=log.sent_at,
        delivered_at=log.delivered_at,
        read_at=log.read_at,
        created_at=log.created_at or _now(),
        updated_at=log.updated_at or _now(),
        timeline=timeline,
    )


def _scope_query(query, current_user: User):
    if current_user.role == UserRole.SUPER_ADMIN:
        return query
    if current_user.branch_id:
        query = query.filter(CommunicationLog.branch_id == current_user.branch_id)
    if current_user.role == UserRole.COUNSELLOR:
        query = query.filter((CommunicationLog.counsellor_id == current_user.id) | (CommunicationLog.counsellor_id.is_(None)))
    return query


def _upsert_analytics(db: Session, log: CommunicationLog) -> None:
    metric_date = (log.sent_at or log.created_at or _now()).date()
    row = (
        db.query(CommunicationAnalytics)
        .filter(CommunicationAnalytics.metric_date == metric_date)
        .filter(CommunicationAnalytics.channel == log.channel)
        .filter(CommunicationAnalytics.branch_id == log.branch_id)
        .filter(CommunicationAnalytics.counsellor_id == log.counsellor_id)
        .first()
    )
    if not row:
        row = CommunicationAnalytics(metric_date=metric_date, channel=log.channel, branch_id=log.branch_id, counsellor_id=log.counsellor_id)
        db.add(row)

    row.sent_count += 1 if log.status in {"sent", "delivered", "read"} else 0
    row.delivered_count += 1 if log.status in {"delivered", "read"} else 0
    row.read_count += 1 if log.status == "read" else 0
    row.failed_count += 1 if log.status == "failed" else 0
    row.pending_count += 1 if log.status == "pending" else 0
    row.updated_at = _now()


def _build_payload(
    db: Session,
    current_user: User,
    search: str | None = None,
    channel: str | None = None,
    status: str | None = None,
    branch_id: str | None = None,
    counsellor_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    _seed_templates(db)
    _seed_logs(db)

    query = db.query(CommunicationLog).order_by(CommunicationLog.created_at.desc())
    query = _scope_query(query, current_user)
    if channel:
        query = query.filter(CommunicationLog.channel == channel)
    if status:
        query = query.filter(CommunicationLog.status == status)
    if branch_id:
        query = query.filter(CommunicationLog.branch_id == branch_id)
    if counsellor_id:
        query = query.filter(CommunicationLog.counsellor_id == counsellor_id)
    if search:
        text = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(CommunicationLog.recipient_name).like(text)
            | func.lower(CommunicationLog.subject).like(text)
            | func.lower(CommunicationLog.message).like(text)
            | func.lower(CommunicationLog.recipient_phone).like(text)
            | func.lower(CommunicationLog.recipient_email).like(text)
        )

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if start:
        query = query.filter(func.date(CommunicationLog.created_at) >= start)
    if end:
        query = query.filter(func.date(CommunicationLog.created_at) <= end)

    logs = query.all()
    templates = db.query(CommunicationTemplate).order_by(CommunicationTemplate.created_at.desc()).all()
    totals = Counter(log.status for log in logs)
    channels = Counter(log.channel for log in logs)
    recent_logs = [_serialize_log(log) for log in logs[:10]]

    channel_breakdown = [
        {"label": "Calls", "value": channels.get("call", 0)},
        {"label": "WhatsApp", "value": channels.get("whatsapp", 0)},
        {"label": "Email", "value": channels.get("email", 0)},
        {"label": "SMS", "value": channels.get("sms", 0)},
    ]
    status_breakdown = [
        {"label": "Sent", "value": totals.get("sent", 0)},
        {"label": "Delivered", "value": totals.get("delivered", 0)},
        {"label": "Read", "value": totals.get("read", 0)},
        {"label": "Failed", "value": totals.get("failed", 0)},
        {"label": "Pending", "value": totals.get("pending", 0)},
    ]

    by_day = defaultdict(lambda: {"call": 0, "whatsapp": 0, "email": 0, "sms": 0})
    for log in logs:
        key = (log.created_at or _now()).date().isoformat()
        by_day[key][log.channel] += 1

    return {
        "generated_at": _now().isoformat(),
        "filters": {
            "search": search,
            "channel": channel,
            "status": status,
            "branch_id": branch_id,
            "counsellor_id": counsellor_id,
            "start_date": start_date,
            "end_date": end_date,
        },
        "summary": {
            "total_communications": len(logs),
            "sent": totals.get("sent", 0) + totals.get("delivered", 0) + totals.get("read", 0),
            "delivered": totals.get("delivered", 0) + totals.get("read", 0),
            "read": totals.get("read", 0),
            "failed": totals.get("failed", 0),
            "pending": totals.get("pending", 0),
        },
        "kpis": [
            {"label": "Calls Made", "value": channels.get("call", 0), "tone": "blue"},
            {"label": "WhatsApp Messages Sent", "value": channels.get("whatsapp", 0), "tone": "green"},
            {"label": "Emails Sent", "value": channels.get("email", 0), "tone": "purple"},
            {"label": "SMS Sent", "value": channels.get("sms", 0), "tone": "orange"},
        ],
        "logs": recent_logs,
        "analytics": {
            "by_channel": channel_breakdown,
            "by_status": status_breakdown,
            "trend": [{"date": key, **values} for key, values in sorted(by_day.items())],
        },
        "templates": [_serialize_template(template) for template in templates],
    }


def _create_log(db: Session, current_user: User, body: CommunicationLogCreate, status_override: str | None = None) -> CommunicationLogResponse:
    _seed_templates(db)
    log = CommunicationLog(
        id=f"log-{uuid.uuid4().hex[:10]}",
        channel=body.channel,
        recipient_name=body.recipient_name,
        recipient_phone=body.recipient_phone,
        recipient_email=body.recipient_email,
        subject=body.subject,
        message=body.message,
        status=status_override or body.status or "pending",
        related_type=body.related_type,
        related_id=body.related_id,
        template_id=body.template_id,
        branch_id=body.branch_id if current_user.role == UserRole.SUPER_ADMIN else getattr(current_user, "branch_id", None),
        counsellor_id=body.counsellor_id if current_user.role == UserRole.SUPER_ADMIN else getattr(current_user, "id", None),
        initiated_by=getattr(current_user, "id", None),
        notes=body.notes,
        failed_reason=body.failed_reason,
        sent_at=_now() if (status_override or body.status) in {"sent", "delivered", "read"} else None,
        delivered_at=_now() if (status_override or body.status) in {"delivered", "read"} else None,
        read_at=_now() if (status_override or body.status) == "read" else None,
    )
    db.add(log)
    _upsert_analytics(db, log)
    if log.template_id:
        template = db.query(CommunicationTemplate).filter(CommunicationTemplate.id == log.template_id).first()
        if template:
            template.usage_count = int(template.usage_count or 0) + 1
            template.updated_at = _now()
    db.commit()
    db.refresh(log)
    return _serialize_log(log)


def _timeline_pdf_rows(payload: dict) -> list[list[str]]:
    rows: list[list[str]] = [["Channel", "Recipient", "Status", "Created"]]
    for log in payload["logs"][:8]:
        rows.append([log.channel.title(), log.recipient_name, log.status.title(), log.created_at.isoformat()])
    return rows


def _xlsx_bytes(sheet_title: str, rows: list[list[str]]) -> bytes:
    def cell_ref(col_index: int, row_index: int) -> str:
        letters = ""
        n = col_index + 1
        while n:
            n, rem = divmod(n - 1, 26)
            letters = chr(65 + rem) + letters
        return f"{letters}{row_index}"

    sheet_rows = []
    for row_index, row in enumerate(rows, start=1):
        cells = []
        for col_index, value in enumerate(row):
            ref = cell_ref(col_index, row_index)
            cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape(value)}</t></is></c>')
        sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets><sheet name="{escape(sheet_title)}" sheetId="1" r:id="rId1"/></sheets>'
        '</workbook>'
    )
    workbook_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '</Relationships>'
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '</Types>'
    )
    app_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>Pinesphere ERP</Application>'
        '</Properties>'
    )
    timestamp = datetime.utcnow().isoformat() + "Z"
    core_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:creator>Pinesphere ERP</dc:creator>'
        '<cp:lastModifiedBy>Pinesphere ERP</cp:lastModifiedBy>'
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:modified>'
        '</cp:coreProperties>'
    )
    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        '</worksheet>'
    )

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", rels)
        archive.writestr("docProps/app.xml", app_xml)
        archive.writestr("docProps/core.xml", core_xml)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
    return buffer.getvalue()


@router.get("", response_model=dict)
def list_communications(
    search: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    status: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
    counsellor_id: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    return _build_payload(db, current_user, search, channel, status, branch_id, counsellor_id, start_date, end_date)


@router.post("/call", response_model=CommunicationLogResponse)
def log_call(
    body: CommunicationLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    return _create_log(db, current_user, body, status_override=body.status if body.status else "sent")


@router.post("/email", response_model=CommunicationLogResponse)
def log_email(
    body: CommunicationLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    return _create_log(db, current_user, body, status_override=body.status if body.status else "sent")


@router.post("/whatsapp", response_model=CommunicationLogResponse)
def log_whatsapp(
    body: CommunicationLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    return _create_log(db, current_user, body, status_override=body.status if body.status else "sent")


@router.post("/sms", response_model=CommunicationLogResponse)
def log_sms(
    body: CommunicationLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    return _create_log(db, current_user, body, status_override=body.status if body.status else "sent")


@router.get("/templates", response_model=list[CommunicationTemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    _seed_templates(db)
    query = db.query(CommunicationTemplate).order_by(CommunicationTemplate.created_at.desc())
    if current_user.role != UserRole.SUPER_ADMIN and current_user.branch_id:
        query = query.filter((CommunicationTemplate.branch_id == current_user.branch_id) | (CommunicationTemplate.branch_id.is_(None)))
    return [_serialize_template(template) for template in query.all()]


@router.post("/templates", response_model=CommunicationTemplateResponse)
def create_template(
    body: CommunicationTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    template = CommunicationTemplate(
        id=f"tmpl-{uuid.uuid4().hex[:10]}",
        name=body.name,
        channel=body.channel,
        category=body.category,
        subject=body.subject,
        body=body.body,
        branch_id=body.branch_id if current_user.role == UserRole.SUPER_ADMIN else getattr(current_user, "branch_id", None),
        created_by=getattr(current_user, "id", None),
        is_active=body.is_active,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _serialize_template(template)


@router.put("/templates/{template_id}", response_model=CommunicationTemplateResponse)
def update_template(
    template_id: str,
    body: CommunicationTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    template = db.query(CommunicationTemplate).filter(CommunicationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if current_user.role != UserRole.SUPER_ADMIN and current_user.branch_id and template.branch_id not in {None, current_user.branch_id}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    for field in ("name", "channel", "category", "subject", "body", "branch_id", "is_active"):
        value = getattr(body, field)
        if value is not None:
            setattr(template, field, value)
    template.updated_at = _now()
    db.commit()
    db.refresh(template)
    return _serialize_template(template)


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    template = db.query(CommunicationTemplate).filter(CommunicationTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if current_user.role != UserRole.SUPER_ADMIN and current_user.branch_id and template.branch_id not in {None, current_user.branch_id}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully", "id": template_id}


@router.get("/analytics", response_model=CommunicationAnalyticsResponse)
def communication_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    payload = _build_payload(db, current_user)
    return CommunicationAnalyticsResponse(
        total_communications=payload["summary"]["total_communications"],
        sent=payload["summary"]["sent"],
        delivered=payload["summary"]["delivered"],
        read=payload["summary"]["read"],
        failed=payload["summary"]["failed"],
        pending=payload["summary"]["pending"],
        by_channel=payload["analytics"]["by_channel"],
        recent_communications=payload["logs"],
        templates=payload["templates"],
    )


@router.get("/export/csv")
def export_csv(
    search: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    status: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
    counsellor_id: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    payload = _build_payload(db, current_user, search, channel, status, branch_id, counsellor_id, start_date, end_date)
    buffer = BytesIO()
    wrapper = __import__("io").TextIOWrapper(buffer, encoding="utf-8", newline="")
    writer = csv.writer(wrapper)
    writer.writerow(["Channel", "Recipient", "Status", "Created At", "Subject"])
    for row in payload["logs"]:
        writer.writerow([row.channel, row.recipient_name, row.status, row.created_at.isoformat(), row.subject or ""])
    wrapper.flush()
    wrapper.detach()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="communications.csv"'})


@router.get("/export/pdf")
def export_pdf(
    search: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    status: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
    counsellor_id: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    payload = _build_payload(db, current_user, search, channel, status, branch_id, counsellor_id, start_date, end_date)
    summary = [
        ("Total Communications", str(payload["summary"]["total_communications"])),
        ("Sent", str(payload["summary"]["sent"])),
        ("Delivered", str(payload["summary"]["delivered"])),
        ("Read", str(payload["summary"]["read"])),
        ("Failed", str(payload["summary"]["failed"])),
    ]
    rows = _timeline_pdf_rows(payload)
    pdf_bytes = _generate_pdf("Pinesphere Communications Report", summary, rows)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="communications-report.pdf"'})


@router.get("/export/excel")
def export_excel(
    search: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    status: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
    counsellor_id: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    payload = _build_payload(db, current_user, search, channel, status, branch_id, counsellor_id, start_date, end_date)
    rows = [["Channel", "Recipient", "Status", "Created At", "Subject"]]
    for row in payload["logs"]:
        rows.append([row.channel, row.recipient_name, row.status, row.created_at.isoformat(), row.subject or ""])
    xlsx_bytes = _xlsx_bytes("Communications", rows)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="communications.xlsx"'},
    )


@router.get("/{communication_id}", response_model=CommunicationLogResponse)
def get_communication(
    communication_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    _seed_templates(db)
    _seed_logs(db)
    log = db.query(CommunicationLog).filter(CommunicationLog.id == communication_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Communication not found")
    if current_user.role != UserRole.SUPER_ADMIN and current_user.branch_id and log.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return _serialize_log(log)


@router.put("/{communication_id}", response_model=CommunicationLogResponse)
def update_communication(
    communication_id: str,
    body: CommunicationLogUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    log = db.query(CommunicationLog).filter(CommunicationLog.id == communication_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Communication not found")
    if current_user.role != UserRole.SUPER_ADMIN and current_user.branch_id and log.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    for field in ("status", "subject", "message", "related_type", "related_id", "template_id", "branch_id", "counsellor_id", "notes", "failed_reason", "sent_at", "delivered_at", "read_at"):
        value = getattr(body, field)
        if value is not None:
            setattr(log, field, value)
    log.updated_at = _now()
    db.commit()
    db.refresh(log)
    return _serialize_log(log)

