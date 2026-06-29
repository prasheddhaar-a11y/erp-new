"""
PINESPHERE ERP
Module      : Admission Module
File        : admission.py
Purpose     : Defines Admission Pydantic schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AdmissionBase(BaseModel):
    student_name: str
    course_interest: Optional[str] = None
    phone: str
    email: Optional[str] = None
    branch_id: Optional[str] = None
    stage: Optional[str] = "Counselling"
    expected_fee: Optional[float] = None
    fee_collected: Optional[float] = 0
    score: Optional[int] = 0
    notes: Optional[str] = None

class AdmissionCreate(AdmissionBase):
    pass

class AdmissionUpdate(BaseModel):
    student_name: Optional[str] = None
    course_interest: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    branch_id: Optional[str] = None
    stage: Optional[str] = None
    expected_fee: Optional[float] = None
    fee_collected: Optional[float] = None
    score: Optional[int] = None
    notes: Optional[str] = None

class AdmissionResponse(AdmissionBase):
    id: str
    counsellor_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
