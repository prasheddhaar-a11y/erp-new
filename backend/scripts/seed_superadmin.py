"""
PINESPHERE ERP
Module      : Backend Platform
File        : seed_superadmin.py
Purpose     : Seeds demo users and branch-isolated counsellor sample data
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

import os
import sys
import uuid
from datetime import date, datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.roles import UserRole, role_abbreviation
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.admission import Admission
from app.models.crm import Lead
from app.models.user import User

DEMO_PASSWORD = "Admin@123"

BRANCHES = {
    "kochi": "Kochi",
    "chennai": "Chennai",
    "madurai": "Madurai",
    "coimbatore": "Coimbatore",
}

DEMO_USERS = [
    ("admin@pinesphere.com", "Super Admin", UserRole.SUPER_ADMIN, None),
    ("sa@pinesphere.com", "Super Admin", UserRole.SUPER_ADMIN, None),
    ("ba@pinesphere.com", "Branch Admin", UserRole.BRANCH_ADMIN, "main"),
    ("counsellor@pinesphere.com", "Main Counsellor", UserRole.COUNSELLOR, "main"),
    ("trainer@pinesphere.com", "Trainer", UserRole.TRAINER, "main"),
    ("student@pinesphere.com", "Student", UserRole.STUDENT, "main"),
    ("parent@pinesphere.com", "Parent", UserRole.PARENT, "main"),
    ("hr@pinesphere.com", "HR Manager", UserRole.HR, "main"),
    ("finance@pinesphere.com", "Finance", UserRole.FINANCE, "main"),
    ("fo@pinesphere.com", "Franchise Owner", UserRole.FRANCHISE_OWNER, None),
    ("ch@pinesphere.com", "Company HR", UserRole.COMPANY_HR, None),
    ("public@pinesphere.com", "Public User", UserRole.PUBLIC, "main"),
]

for branch_id, branch_name in BRANCHES.items():
    DEMO_USERS.extend([
        (f"{branch_id}@pinesphere.com", f"{branch_name} Branch Admin", UserRole.BRANCH_ADMIN, branch_id),
        (f"{branch_id}.counsellor@pinesphere.com", f"{branch_name} Counsellor", UserRole.COUNSELLOR, branch_id),
    ])

BRANCH_SAMPLE_DATA = {
    "kochi": {
        "students": ["Meera Nair", "Arjun Menon", "Devika Suresh"],
        "courses": ["Full Stack Development", "Data Science", "Python Automation"],
    },
    "chennai": {
        "students": ["Ananya Raman", "Karthik Subramanian", "Nivetha Raj"],
        "courses": ["Java Full Stack", "Cloud Computing", "UI UX Design"],
    },
    "madurai": {
        "students": ["Harini Pandian", "Vignesh Kumar", "Priya Selvam"],
        "courses": ["Python Full Stack", "Digital Marketing", "Data Analytics"],
    },
    "coimbatore": {
        "students": ["Sanjay Krishnan", "Aishwarya Devi", "Mohan Prakash"],
        "courses": ["MERN Stack", "Cyber Security", "Machine Learning"],
    },
}


def _upsert_user(db, email: str, full_name: str, role: UserRole, branch_id: str | None, password_hash: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.full_name = full_name
        user.role = role
        user.role_abbreviation = role_abbreviation(role)
        user.branch_id = branch_id
        user.hashed_password = password_hash
        user.is_active = True
        user.email_verified = True
        return user
    user = User(
        id=str(uuid.uuid4()),
        full_name=full_name,
        email=email,
        hashed_password=password_hash,
        role=role,
        role_abbreviation=role_abbreviation(role),
        branch_id=branch_id,
        is_active=True,
        email_verified=True,
        student_status="active" if role == UserRole.STUDENT else "active",
        document_status="verified" if role == UserRole.STUDENT else "pending",
        course_enrolled="Java" if role == UserRole.STUDENT else None,
        batch_name="Batch 1" if role == UserRole.STUDENT else None,
    )
    db.add(user)
    db.flush()
    return user


def _ensure_branch_samples(db, branch_id: str, password_hash: str, counsellor: User) -> list[str]:
    messages: list[str] = []
    branch_name = BRANCHES[branch_id]
    samples = BRANCH_SAMPLE_DATA[branch_id]
    now = datetime.utcnow()

    for index, student_name in enumerate(samples["students"], start=1):
        slug = student_name.lower().replace(" ", ".")
        phone_suffix = {"kochi": "70", "chennai": "71", "madurai": "72", "coimbatore": "73"}[branch_id]
        student_email = f"{slug}.{branch_id}@pinesphere.com"
        student_phone = f"9{phone_suffix}{index:07d}"
        course = samples["courses"][(index - 1) % len(samples["courses"])]
        student = db.query(User).filter(User.email == student_email).first()
        if not student:
            student = User(
                id=str(uuid.uuid4()),
                full_name=student_name,
                email=student_email,
                phone=student_phone,
                hashed_password=password_hash,
                role=UserRole.STUDENT,
                role_abbreviation=role_abbreviation(UserRole.STUDENT),
                branch_id=branch_id,
                is_active=True,
                email_verified=True,
                display_code=f"{branch_id[:3].upper()}-ST-{index:03d}",
                parent_name=f"Parent of {student_name.split()[0]}",
                parent_phone=f"8{phone_suffix}{index:07d}",
                emergency_contact=f"7{phone_suffix}{index:07d}",
                course_enrolled=course,
                batch_name=f"{branch_name} Batch {index}",
                trainer_name=f"{branch_name} Trainer",
                student_status="active",
                document_status="verified" if index != 2 else "pending",
                admission_date=date.today() - timedelta(days=14 + index),
            )
            db.add(student)
            messages.append(f"Created {branch_name} student: {student_email}")

        lead_email = f"lead.{slug}.{branch_id}@pinesphere.com"
        lead = db.query(Lead).filter(Lead.email == lead_email).first()
        if not lead:
            lead = Lead(
                student_name=student_name,
                parent_name=f"Parent of {student_name.split()[0]}",
                phone=f"6{phone_suffix}{index:07d}",
                email=lead_email,
                course_interest=course,
                source="walk-in" if index == 1 else "website",
                status=["new", "contacted", "qualified"][index - 1],
                score=65 + index * 8,
                demo_attended="pending" if index == 1 else "yes",
                branch_id=branch_id,
                counsellor_id=counsellor.id,
                next_follow_up_at=now + timedelta(days=index - 1),
                notes=f"{branch_name} branch enquiry for {course}.",
            )
            db.add(lead)
            messages.append(f"Created {branch_name} lead: {lead_email}")

        admission_email = f"admission.{slug}.{branch_id}@pinesphere.com"
        admission = db.query(Admission).filter(Admission.email == admission_email).first()
        if not admission:
            admission = Admission(
                student_name=student_name,
                course_interest=course,
                phone=f"5{phone_suffix}{index:07d}",
                email=admission_email,
                counsellor_id=counsellor.id,
                branch_id=branch_id,
                stage=["Counselling", "Documents", "Fee Pending"][index - 1],
                expected_fee=45000 + index * 5000,
                fee_collected=15000 * index,
                score=70 + index * 5,
                notes=f"{branch_name} admission pipeline sample.",
            )
            db.add(admission)
            messages.append(f"Created {branch_name} admission: {admission_email}")
    return messages


def ensure_demo_users() -> list[str]:
    db = SessionLocal()
    messages: list[str] = []
    password_hash = hash_password(DEMO_PASSWORD)
    try:
        users_by_email: dict[str, User] = {}
        for email, full_name, role, branch_id in DEMO_USERS:
            user = _upsert_user(db, email, full_name, role, branch_id, password_hash)
            users_by_email[email] = user
            messages.append(f"Ensured user: {email}")
        db.flush()

        for branch_id in BRANCHES:
            counsellor = users_by_email[f"{branch_id}.counsellor@pinesphere.com"]
            messages.extend(_ensure_branch_samples(db, branch_id, password_hash, counsellor))

        db.commit()
    finally:
        db.close()
    return messages


if __name__ == "__main__":
    for message in ensure_demo_users():
        print(message)
