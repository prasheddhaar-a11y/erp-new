"""
PINESPHERE ERP
Module      : Attendance Module
File        : attendance.py
Purpose     : Defines Attendance request and response schemas
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

from datetime import date, datetime

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class AttendanceSessionCreate(BaseModel):
    title: str
    session_date: date
    course_id: str | None = None


class AttendanceQuickMark(BaseModel):
    title: str
    session_date: date
    course_id: str | None = None
    status: str = "present"
    remarks: str | None = None


class AttendanceSessionResponse(AttendanceSessionCreate):
    id: str
    trainer_id: str
    qr_token: str | None = None
    qr_expires_at: datetime | None = None

    class Config:
        from_attributes = True


class AttendanceRecordCreate(BaseModel):
    student_id: str
    status: str
    minutes_late: int = 0
    remarks: str | None = None


class AttendanceBulkMark(BaseModel):
    records: list[AttendanceRecordCreate]


class QrAttendanceMark(BaseModel):
    qr_token: str


class AttendanceReportFilter(BaseModel):
    course_id: str | None = None
    student_id: str | None = None
    date_from: date | None = None
    date_to: date | None = None
