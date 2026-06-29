-- Branch Admin production-like seed data for PostgreSQL.
-- Scope: Branch Admin only. Run after migrations/create_all have created the tables.
-- The script is deterministic and idempotent for IDs/codes prefixed with BA-SEED.

BEGIN;

DELETE FROM history_events WHERE record_id LIKE 'ba-seed-%' OR branch_id LIKE 'ba-seed-%';

DELETE FROM payments WHERE reference_number LIKE 'BA-SEED-%';
DELETE FROM invoices WHERE invoice_number LIKE 'BA-SEED-%';
DELETE FROM attendance_records WHERE session_id LIKE 'ba-seed-%';
DELETE FROM attendance_sessions WHERE id LIKE 'ba-seed-%';
DELETE FROM trainer_workload WHERE id LIKE 'ba-seed-%';
DELETE FROM hr_employees WHERE id LIKE 'ba-seed-%';
DELETE FROM lesson_progress WHERE id LIKE 'ba-seed-%';
DELETE FROM enrollments WHERE id LIKE 'ba-seed-%';
DELETE FROM batch_student_enrollments WHERE id LIKE 'ba-seed-%';
DELETE FROM batch_trainer_assignments WHERE id LIKE 'ba-seed-%';
DELETE FROM batches WHERE id LIKE 'ba-seed-%';
DELETE FROM lessons WHERE id LIKE 'ba-seed-%';
DELETE FROM courses WHERE id LIKE 'ba-seed-%';
DELETE FROM admissions WHERE id LIKE 'ba-seed-%';
DELETE FROM leads WHERE id LIKE 'ba-seed-%';
DELETE FROM users WHERE id LIKE 'ba-seed-%';
DELETE FROM branches WHERE id LIKE 'ba-seed-%';

INSERT INTO branches (id, name, code, city, address, manager_name, phone, capacity, status, display_code, created_at, updated_at)
VALUES
('ba-seed-branch-01', 'Pinesphere Chennai Tech Park', 'BA-CHN', 'Chennai', 'No. 42, Old Mahabalipuram Road, Thoraipakkam, Chennai', 'Arun Prakash', '+919840012301', 420, 'active', 'BR-CHN-001', NOW() - INTERVAL '420 days', NOW()),
('ba-seed-branch-02', 'Pinesphere Coimbatore Learning Hub', 'BA-CBE', 'Coimbatore', '18 Avinashi Road, Peelamedu, Coimbatore', 'Meera Natarajan', '+919840012302', 360, 'active', 'BR-CBE-002', NOW() - INTERVAL '390 days', NOW()),
('ba-seed-branch-03', 'Pinesphere Madurai Skills Centre', 'BA-MDU', 'Madurai', '7 Lake View Road, K.K. Nagar, Madurai', 'Karthik Raman', '+919840012303', 300, 'active', 'BR-MDU-003', NOW() - INTERVAL '360 days', NOW()),
('ba-seed-branch-04', 'Pinesphere Kochi Career Campus', 'BA-KOC', 'Kochi', '31 Infopark Road, Kakkanad, Kochi', 'Nisha Menon', '+919840012304', 280, 'active', 'BR-KOC-004', NOW() - INTERVAL '330 days', NOW()),
('ba-seed-branch-05', 'Pinesphere Bengaluru Digital Academy', 'BA-BLR', 'Bengaluru', '55 Outer Ring Road, Marathahalli, Bengaluru', 'Vikram Shetty', '+919840012305', 450, 'active', 'BR-BLR-005', NOW() - INTERVAL '300 days', NOW());

WITH names AS (
    SELECT *
    FROM unnest(ARRAY[
        'Aarav Sharma','Diya Iyer','Vivaan Reddy','Ananya Menon','Aditya Nair','Ishita Rao','Arjun Krishnan','Meera Kulkarni','Rohan Bhat','Kavya Srinivasan',
        'Siddharth Jain','Nandini Pillai','Rahul Varma','Sneha Kapoor','Kiran Kumar','Pooja Suresh','Nikhil Gupta','Aishwarya Rajan','Harish Nambiar','Priya Thomas',
        'Manav Shah','Lakshmi Narayan','Akash Verma','Swathi Murthy','Vignesh Subramanian','Neha Agarwal','Gokul Das','Ritika Singh','Pranav Nair','Janani Balan',
        'Sanjay Patel','Anu George','Yash Mehta','Keerthana Ramesh','Deepak Menon','Malavika S','Saran Kumar','Harini Venkatesh','Abhinav Bose','Shreya Iyer'
    ]) WITH ORDINALITY AS t(full_name, n)
),
branches AS (
    SELECT id, name, city, ROW_NUMBER() OVER (ORDER BY id) AS branch_no FROM branches WHERE id LIKE 'ba-seed-branch-%'
)
INSERT INTO users (
    id, email, phone, full_name, hashed_password, role, role_abbreviation, branch_id, is_active,
    display_code, email_verified, email_verified_at, invite_status, failed_login_attempts,
    date_of_birth, gender, address, parent_name, parent_phone, emergency_contact,
    course_enrolled, batch_name, trainer_name, student_status, document_status, admission_date,
    last_login_at, created_at, updated_at
)
SELECT
    'ba-seed-student-' || LPAD(gs::text, 3, '0'),
    LOWER(REPLACE(n.full_name, ' ', '.')) || LPAD(gs::text, 3, '0') || '@student.pinesphere.edu',
    '+9197' || LPAD((51000000 + gs)::text, 8, '0'),
    n.full_name,
    '$2b$12$branchadminseedhashplaceholder000000000000000000000000000',
    'STUDENT'::userrole,
    'ST',
    b.id,
    TRUE,
    'STU-BA-' || LPAD(gs::text, 4, '0'),
    TRUE,
    NOW() - INTERVAL '90 days',
    'accepted',
    '0',
    DATE '2000-01-01' + ((gs % 1800) * INTERVAL '1 day'),
    CASE WHEN gs % 2 = 0 THEN 'Female' ELSE 'Male' END,
    (10 + gs) || ', ' || SPLIT_PART(b.name, ' ', 2) || ' Main Road, ' || b.city,
    (ARRAY['Rajesh','Suresh','Mahesh','Ganesh','Ramesh','Joseph','Abdul','Manoj','Prakash','Dinesh'])[1 + (gs % 10)] || ' ' || SPLIT_PART(n.full_name, ' ', 2),
    '+9188' || LPAD((62000000 + gs)::text, 8, '0'),
    '+9189' || LPAD((73000000 + gs)::text, 8, '0'),
    NULL,
    NULL,
    NULL,
    CASE WHEN gs % 17 = 0 THEN 'inactive' ELSE 'active' END,
    CASE WHEN gs % 11 = 0 THEN 'pending' ELSE 'verified' END,
    CURRENT_DATE - ((gs % 120) * INTERVAL '1 day'),
    NOW() - ((gs % 25) * INTERVAL '1 day'),
    NOW() - ((120 - (gs % 90)) * INTERVAL '1 day'),
    NOW()
FROM generate_series(1, 200) AS gs
JOIN names n ON n.n = ((gs - 1) % 40) + 1
JOIN branches b ON b.branch_no = ((gs - 1) % 5) + 1;

WITH staff AS (
    SELECT gs, role_name, role_abbr, label
    FROM generate_series(1, 45) gs
    CROSS JOIN LATERAL (
        SELECT CASE
            WHEN gs <= 20 THEN 'TRAINER'
            WHEN gs <= 30 THEN 'COUNSELLOR'
            WHEN gs <= 35 THEN 'BRANCH_ADMIN'
            WHEN gs <= 40 THEN 'FINANCE'
            ELSE 'HR'
        END AS role_name,
        CASE
            WHEN gs <= 20 THEN 'TR'
            WHEN gs <= 30 THEN 'CL'
            WHEN gs <= 35 THEN 'BA'
            WHEN gs <= 40 THEN 'FN'
            ELSE 'HR'
        END AS role_abbr,
        CASE
            WHEN gs <= 20 THEN 'Trainer'
            WHEN gs <= 30 THEN 'Counsellor'
            WHEN gs <= 35 THEN 'Branch Admin'
            WHEN gs <= 40 THEN 'Fee Executive'
            ELSE 'Operations Staff'
        END AS label
    ) r
),
branches AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS branch_no FROM branches WHERE id LIKE 'ba-seed-branch-%'
)
INSERT INTO users (
    id, email, phone, full_name, hashed_password, role, role_abbreviation, branch_id, is_active,
    display_code, email_verified, email_verified_at, invite_status, failed_login_attempts,
    last_login_at, created_at, updated_at
)
SELECT
    'ba-seed-staff-' || LPAD(gs::text, 3, '0'),
    LOWER(REPLACE(label, ' ', '.')) || LPAD(gs::text, 2, '0') || '@pinesphere.com',
    '+9196' || LPAD((44000000 + gs)::text, 8, '0'),
    label || ' ' || (ARRAY['Arun','Meera','Karthik','Nisha','Vikram','Divya','Sathish','Latha','Raghu','Farah','Mohan','Irene','Pradeep','Sonia','Bala'])[1 + ((gs - 1) % 15)],
    '$2b$12$branchadminseedhashplaceholder000000000000000000000000000',
    role_name::userrole,
    role_abbr,
    b.id,
    TRUE,
    'USR-BA-' || LPAD(gs::text, 4, '0'),
    TRUE,
    NOW() - INTERVAL '120 days',
    'accepted',
    '0',
    NOW() - ((gs % 12) * INTERVAL '1 day'),
    NOW() - INTERVAL '180 days',
    NOW()
FROM staff
JOIN branches b ON b.branch_no = ((gs - 1) % 5) + 1;

WITH staff_users AS (
    SELECT id, email, phone, full_name, role, branch_id, ROW_NUMBER() OVER (ORDER BY id) rn
    FROM users
    WHERE id LIKE 'ba-seed-staff-%'
)
INSERT INTO hr_employees (
    id, employee_id, full_name, email, phone, role, department, branch_id,
    reporting_manager, joining_date, salary, status, emergency_contact,
    bank_account, documents_status, created_at, updated_at
)
SELECT
    'ba-seed-employee-' || LPAD(rn::text, 3, '0'),
    'EMP-BA-' || LPAD(rn::text, 4, '0'),
    full_name,
    REPLACE(email, '@pinesphere.com', '@hr.pinesphere.com'),
    phone,
    CASE
        WHEN role = 'TRAINER' THEN 'Trainer'
        WHEN role = 'COUNSELLOR' THEN 'Counsellor'
        WHEN role = 'BRANCH_ADMIN' THEN 'Branch Admin'
        WHEN role = 'FINANCE' THEN 'Finance Executive'
        ELSE 'Operations Staff'
    END,
    CASE
        WHEN role = 'TRAINER' THEN 'Academics'
        WHEN role = 'COUNSELLOR' THEN 'Admissions'
        WHEN role = 'BRANCH_ADMIN' THEN 'Branch Operations'
        WHEN role = 'FINANCE' THEN 'Finance'
        ELSE 'Administration'
    END,
    branch_id,
    'Regional Operations Manager',
    CURRENT_DATE - ((210 - rn) * INTERVAL '1 day'),
    CASE
        WHEN role = 'TRAINER' THEN 62000
        WHEN role = 'COUNSELLOR' THEN 42000
        WHEN role = 'BRANCH_ADMIN' THEN 72000
        WHEN role = 'FINANCE' THEN 46000
        ELSE 38000
    END,
    'Active',
    '+9187' || LPAD((83000000 + rn)::text, 8, '0'),
    'BA-SEED-BANK-' || LPAD(rn::text, 4, '0'),
    'Verified',
    NOW() - INTERVAL '180 days',
    NOW()
FROM staff_users;

WITH trainers AS (
    SELECT e.id, e.branch_id, ROW_NUMBER() OVER (ORDER BY e.id) rn
    FROM hr_employees e
    WHERE e.id LIKE 'ba-seed-employee-%' AND e.role ILIKE '%trainer%'
)
INSERT INTO trainer_workload (id, trainer_id, branch_id, total_batches, total_students, weekly_classes, pending_assignments, workload_status, updated_at)
SELECT
    'ba-seed-workload-' || LPAD(rn::text, 3, '0'),
    id,
    branch_id,
    1 + (rn % 3),
    18 + (rn % 22),
    6 + (rn % 5),
    rn % 4,
    CASE WHEN rn % 6 = 0 THEN 'Overloaded' ELSE 'Balanced' END,
    NOW()
FROM trainers;

WITH trainers AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE id LIKE 'ba-seed-staff-%' AND role = 'TRAINER'::userrole
)
INSERT INTO courses (id, title, description, thumbnail_url, trainer_id, duration, difficulty_level, status, display_code, created_at, updated_at)
SELECT
    'ba-seed-course-' || LPAD(gs::text, 2, '0'),
    (ARRAY[
        'Full Stack Web Development','Python Data Analytics','Digital Marketing Professional','UI UX Product Design','Cloud Computing with AWS',
        'Java Spring Boot Services','Cyber Security Essentials','Business Analytics with Power BI','Mobile App Development','DevOps Foundation',
        'Artificial Intelligence Foundation','Accounting and Tally Prime','Human Resource Operations','CRM and Sales Operations','Spoken English for Careers'
    ])[gs],
    'Industry aligned program with project work, mentor reviews, attendance tracking, and placement readiness outcomes.',
    NULL,
    t.id,
    (ARRAY['12 weeks','10 weeks','8 weeks','14 weeks','16 weeks'])[1 + (gs % 5)],
    (ARRAY['Beginner','Intermediate','Advanced'])[1 + (gs % 3)],
    'published',
    'CRS-BA-' || LPAD(gs::text, 3, '0'),
    NOW() - ((150 - gs) * INTERVAL '1 day'),
    NOW()
FROM generate_series(1, 15) gs
JOIN trainers t ON t.rn = ((gs - 1) % 20) + 1;

INSERT INTO lessons (id, course_id, title, summary, content_type, max_marks, sort_order, is_preview, created_at)
SELECT
    'ba-seed-lesson-' || LPAD(c.course_no::text, 2, '0') || '-' || LPAD(l.lesson_no::text, 2, '0'),
    c.id,
    'Module ' || l.lesson_no || ': ' || (ARRAY['Orientation','Core Concepts','Guided Practice','Case Study','Assessment Review','Capstone Planning'])[l.lesson_no],
    'Structured lesson for weekly learning progress and report trend calculation.',
    CASE WHEN l.lesson_no = 5 THEN 'assignment' ELSE 'lesson' END,
    CASE WHEN l.lesson_no = 5 THEN 100 ELSE 0 END,
    l.lesson_no,
    l.lesson_no = 1,
    NOW() - ((90 - l.lesson_no) * INTERVAL '1 day')
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) course_no FROM courses WHERE id LIKE 'ba-seed-course-%') c
CROSS JOIN generate_series(1, 6) AS l(lesson_no);

WITH courses AS (
    SELECT id, title, ROW_NUMBER() OVER (ORDER BY id) rn FROM courses WHERE id LIKE 'ba-seed-course-%'
),
branches AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM branches WHERE id LIKE 'ba-seed-branch-%'
)
INSERT INTO batches (id, name, branch_id, course_id, start_date, end_date, schedule, status, created_at, updated_at)
SELECT
    'ba-seed-batch-' || LPAD(gs::text, 2, '0'),
    'BA-' || br.rn || '-' || SPLIT_PART(c.title, ' ', 1) || '-' || LPAD(gs::text, 2, '0'),
    br.id,
    c.id,
    CURRENT_DATE - ((90 - gs) * INTERVAL '1 day'),
    CURRENT_DATE + ((60 + gs) * INTERVAL '1 day'),
    jsonb_build_object('days', ARRAY['Monday','Wednesday','Friday'], 'time', CASE WHEN gs % 2 = 0 THEN '10:00 AM' ELSE '06:00 PM' END),
    CASE WHEN gs % 13 = 0 THEN 'completed' ELSE 'active' END,
    NOW() - ((100 - gs) * INTERVAL '1 day'),
    NOW()
FROM generate_series(1, 25) gs
JOIN courses c ON c.rn = ((gs - 1) % 15) + 1
JOIN branches br ON br.rn = ((gs - 1) % 5) + 1;

WITH trainers AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE id LIKE 'ba-seed-staff-%' AND role = 'TRAINER'::userrole
),
batches AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM batches WHERE id LIKE 'ba-seed-batch-%'
)
INSERT INTO batch_trainer_assignments (id, batch_id, trainer_id, assigned_at)
SELECT
    'ba-seed-bta-' || LPAD(b.rn::text, 2, '0') || '-1',
    b.id,
    t.id,
    NOW() - INTERVAL '75 days'
FROM batches b
JOIN trainers t ON t.rn = ((b.rn - 1) % 20) + 1;

WITH students AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE id LIKE 'ba-seed-student-%'
),
batches AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM batches WHERE id LIKE 'ba-seed-batch-%'
)
INSERT INTO batch_student_enrollments (id, batch_id, student_id, enrolled_at, status)
SELECT
    'ba-seed-bse-' || LPAD(s.rn::text, 3, '0'),
    b.id,
    s.id,
    NOW() - ((80 - (s.rn % 50)) * INTERVAL '1 day'),
    CASE WHEN s.rn % 17 = 0 THEN 'inactive' ELSE 'active' END
FROM students s
JOIN batches b ON b.rn = ((s.rn - 1) % 25) + 1;

WITH students AS (
    SELECT u.id, u.batch_name, e.batch_id, b.course_id, ROW_NUMBER() OVER (ORDER BY u.id) rn
    FROM users u
    JOIN batch_student_enrollments e ON e.student_id = u.id
    JOIN batches b ON b.id = e.batch_id
    WHERE u.id LIKE 'ba-seed-student-%'
)
INSERT INTO enrollments (id, course_id, student_id, progress_percent, batch_name, status, enrolled_at)
SELECT
    'ba-seed-enrollment-' || LPAD(rn::text, 3, '0'),
    course_id,
    id,
    35 + (rn % 61),
    batch_id,
    CASE WHEN rn % 17 = 0 THEN 'inactive' ELSE 'active' END,
    NOW() - ((85 - (rn % 55)) * INTERVAL '1 day')
FROM students;

UPDATE users u
SET
    course_enrolled = c.title,
    batch_name = b.name,
    trainer_name = t.full_name,
    updated_at = NOW()
FROM batch_student_enrollments bse
JOIN batches b ON b.id = bse.batch_id
JOIN courses c ON c.id = b.course_id
LEFT JOIN batch_trainer_assignments bta ON bta.batch_id = b.id
LEFT JOIN users t ON t.id = bta.trainer_id
WHERE u.id = bse.student_id
  AND u.id LIKE 'ba-seed-student-%';

WITH students AS (
    SELECT e.student_id, e.course_id, e.progress_percent, ROW_NUMBER() OVER (ORDER BY e.student_id) rn
    FROM enrollments e WHERE e.id LIKE 'ba-seed-enrollment-%'
),
lessons AS (
    SELECT id, course_id, sort_order FROM lessons WHERE id LIKE 'ba-seed-lesson-%'
)
INSERT INTO lesson_progress (id, lesson_id, student_id, is_completed, completed_at)
SELECT
    'ba-seed-progress-' || LPAD(s.rn::text, 3, '0') || '-' || LPAD(l.sort_order::text, 2, '0'),
    l.id,
    s.student_id,
    (l.sort_order * 16) <= s.progress_percent,
    CASE WHEN (l.sort_order * 16) <= s.progress_percent THEN NOW() - ((60 - l.sort_order - (s.rn % 20)) * INTERVAL '1 day') ELSE NULL END
FROM students s
JOIN lessons l ON l.course_id = s.course_id;

WITH counsellors AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE id LIKE 'ba-seed-staff-%' AND role = 'COUNSELLOR'::userrole
),
branches AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM branches WHERE id LIKE 'ba-seed-branch-%'
),
course_titles AS (
    SELECT title, ROW_NUMBER() OVER (ORDER BY id) rn FROM courses WHERE id LIKE 'ba-seed-course-%'
)
INSERT INTO admissions (id, student_name, course_interest, phone, email, counsellor_id, branch_id, stage, expected_fee, fee_collected, score, notes, created_at, updated_at)
SELECT
    'ba-seed-admission-' || LPAD(gs::text, 3, '0'),
    (ARRAY['Akhil','Bhavana','Charan','Devika','Eshan','Fathima','Gautham','Hema','Imran','Jeeva','Krithi','Lokesh','Maya','Naveen','Oviya','Parth','Riya','Sahil','Tanvi','Uday'])[1 + ((gs - 1) % 20)] || ' ' ||
    (ARRAY['Sharma','Iyer','Menon','Reddy','Nair','Khan','Das','Pillai','Patel','Thomas'])[1 + ((gs - 1) % 10)],
    ct.title,
    '+9195' || LPAD((30000000 + gs)::text, 8, '0'),
    'lead' || LPAD(gs::text, 3, '0') || '@examplemail.com',
    c.id,
    b.id,
    CASE
        WHEN gs <= 168 THEN 'Converted'
        WHEN gs <= 205 THEN 'Counselling'
        WHEN gs <= 232 THEN 'Application'
        WHEN gs <= 244 THEN 'Rejected'
        ELSE 'Waitlisted'
    END,
    (ARRAY[32000, 42000, 52000, 65000, 78000])[1 + (gs % 5)],
    CASE WHEN gs <= 168 THEN (ARRAY[10000,15000,20000,25000,30000])[1 + (gs % 5)] ELSE 0 END,
    55 + (gs % 45),
    'Branch admin seed lead with counsellor follow-up and source tracking.',
    NOW() - ((90 - (gs % 90)) * INTERVAL '1 day'),
    NOW() - ((gs % 20) * INTERVAL '1 day')
FROM generate_series(1, 250) gs
JOIN counsellors c ON c.rn = ((gs - 1) % 10) + 1
JOIN branches b ON b.rn = ((gs - 1) % 5) + 1
JOIN course_titles ct ON ct.rn = ((gs - 1) % 15) + 1;

INSERT INTO leads (
    id, student_name, parent_name, phone, email, course_interest, source, status, score,
    lost_reason, demo_at, demo_mode, demo_link, demo_attended, branch_id, counsellor_id,
    next_follow_up_at, notes, created_at, updated_at
)
SELECT
    REPLACE(id, 'ba-seed-admission-', 'ba-seed-lead-'),
    student_name,
    'Parent of ' || SPLIT_PART(student_name, ' ', 1),
    phone,
    email,
    course_interest,
    (ARRAY['walk-in','website','referral','education-fair','phone-call'])[1 + ((score - 55) % 5)],
    CASE
        WHEN stage = 'Converted' THEN 'converted'
        WHEN stage = 'Rejected' THEN 'rejected'
        WHEN stage = 'Application' THEN 'approved'
        WHEN stage = 'Waitlisted' THEN 'pending'
        ELSE 'new'
    END,
    score,
    CASE WHEN stage = 'Rejected' THEN 'Budget mismatch after counselling' ELSE NULL END,
    created_at + INTERVAL '2 days',
    CASE WHEN score % 2 = 0 THEN 'online' ELSE 'offline' END,
    CASE WHEN score % 2 = 0 THEN 'https://meet.pinesphere.com/demo/' || id ELSE NULL END,
    CASE WHEN stage IN ('Converted','Application') THEN 'attended' ELSE 'pending' END,
    branch_id,
    counsellor_id,
    updated_at + INTERVAL '3 days',
    notes,
    created_at,
    updated_at
FROM admissions
WHERE id LIKE 'ba-seed-admission-%';

WITH students AS (
    SELECT u.id, u.branch_id, c.title AS course_title, ROW_NUMBER() OVER (ORDER BY u.id) rn
    FROM users u
    JOIN enrollments e ON e.student_id = u.id
    JOIN courses c ON c.id = e.course_id
    WHERE u.id LIKE 'ba-seed-student-%'
)
INSERT INTO invoices (id, invoice_number, student_id, branch_id, course_name, amount, paid_amount, status, due_date, notes, created_at, updated_at)
SELECT
    'ba-seed-invoice-' || LPAD(rn::text, 3, '0'),
    'BA-SEED-INV-' || LPAD(rn::text, 4, '0'),
    id,
    branch_id,
    course_title,
    (ARRAY[32000, 42000, 52000, 65000, 78000])[1 + (rn % 5)],
    CASE
        WHEN rn <= 145 THEN (ARRAY[32000, 42000, 52000, 65000, 78000])[1 + (rn % 5)]
        WHEN rn <= 185 THEN ((ARRAY[32000, 42000, 52000, 65000, 78000])[1 + (rn % 5)] * 0.50)
        ELSE 0
    END,
    CASE WHEN rn <= 145 THEN 'paid' WHEN rn <= 185 THEN 'partial' ELSE 'unpaid' END,
    CURRENT_DATE + ((rn % 45) * INTERVAL '1 day'),
    'Seed invoice aligned with Branch Admin fee dashboard totals.',
    NOW() - ((75 - (rn % 60)) * INTERVAL '1 day'),
    NOW()
FROM students;

INSERT INTO payments (id, invoice_id, student_id, amount, payment_method, reference_number, paid_at, notes)
SELECT
    'ba-seed-payment-' || LPAD(ROW_NUMBER() OVER (ORDER BY i.id)::text, 3, '0'),
    i.id,
    i.student_id,
    i.paid_amount,
    (ARRAY['upi','card','bank_transfer','cash'])[1 + (ROW_NUMBER() OVER (ORDER BY i.id) % 4)],
    'BA-SEED-PAY-' || LPAD(ROW_NUMBER() OVER (ORDER BY i.id)::text, 4, '0'),
    NOW() - ((ROW_NUMBER() OVER (ORDER BY i.id) % 45) * INTERVAL '1 day'),
    'Verified seed payment for Branch Admin collection reports.'
FROM invoices i
WHERE i.id LIKE 'ba-seed-invoice-%' AND i.paid_amount > 0;

WITH batches AS (
    SELECT b.id, b.course_id, b.branch_id, ta.trainer_id, ROW_NUMBER() OVER (ORDER BY b.id) rn
    FROM batches b
    JOIN batch_trainer_assignments ta ON ta.batch_id = b.id
    WHERE b.id LIKE 'ba-seed-batch-%'
),
session_days AS (
    SELECT d::date AS session_date, ROW_NUMBER() OVER (ORDER BY d) day_no
    FROM generate_series(CURRENT_DATE - INTERVAL '59 days', CURRENT_DATE, INTERVAL '1 day') d
    WHERE EXTRACT(ISODOW FROM d) IN (1,3,5) OR d::date = CURRENT_DATE
)
INSERT INTO attendance_sessions (id, course_id, trainer_id, title, session_date, qr_token, qr_expires_at, created_at)
SELECT
    'ba-seed-session-' || LPAD(b.rn::text, 2, '0') || '-' || LPAD(sd.day_no::text, 2, '0'),
    b.course_id,
    b.trainer_id,
    'Batch ' || LPAD(b.rn::text, 2, '0') || ' scheduled class',
    sd.session_date,
    'BA-SEED-QR-' || LPAD(b.rn::text, 2, '0') || '-' || LPAD(sd.day_no::text, 2, '0'),
    sd.session_date + TIME '23:59:00',
    sd.session_date + TIME '08:30:00'
FROM batches b
CROSS JOIN session_days sd;

WITH enrollments AS (
    SELECT bse.student_id, bse.batch_id, ROW_NUMBER() OVER (PARTITION BY bse.batch_id ORDER BY bse.student_id) student_no
    FROM batch_student_enrollments bse
    WHERE bse.id LIKE 'ba-seed-bse-%' AND bse.status = 'active'
),
sessions AS (
    SELECT s.id, s.trainer_id, s.session_date, b.id AS batch_id,
           ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY s.session_date) session_no
    FROM attendance_sessions s
    JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM batches WHERE id LIKE 'ba-seed-batch-%') b
      ON b.rn = SUBSTRING(s.id FROM 17 FOR 2)::integer
    WHERE s.id LIKE 'ba-seed-session-%'
)
INSERT INTO attendance_records (id, session_id, student_id, status, minutes_late, marked_by_id, method, remarks, marked_at)
SELECT
    'ba-seed-att-' || SUBSTRING(s.id FROM 17) || '-' || LPAD(e.student_no::text, 2, '0'),
    s.id,
    e.student_id,
    CASE
        WHEN (e.student_no + s.session_no) % 13 = 0 THEN 'absent'
        WHEN (e.student_no + s.session_no) % 7 = 0 THEN 'late'
        ELSE 'present'
    END,
    CASE WHEN (e.student_no + s.session_no) % 7 = 0 THEN 10 + ((e.student_no + s.session_no) % 20) ELSE 0 END,
    s.trainer_id,
    CASE WHEN s.session_no % 4 = 0 THEN 'qr' ELSE 'manual' END,
    CASE WHEN (e.student_no + s.session_no) % 13 = 0 THEN 'Absent with follow-up required' ELSE 'Marked during scheduled class' END,
    s.session_date + TIME '10:15:00'
FROM sessions s
JOIN enrollments e ON e.batch_id = s.batch_id;

WITH users_for_logs AS (
    SELECT id, branch_id, ROW_NUMBER() OVER (ORDER BY id) rn
    FROM users
    WHERE id LIKE 'ba-seed-staff-%' OR id LIKE 'ba-seed-student-%'
)
INSERT INTO history_events (id, module, action, title, details, record_id, created_by_id, branch_id, created_at)
SELECT
    'ba-seed-history-' || LPAD(gs::text, 3, '0'),
    (ARRAY['branch-admin','admissions','students','attendance','fees','users','reports'])[1 + (gs % 7)],
    (ARRAY['created','updated','reviewed','approved','collected','exported'])[1 + (gs % 6)],
    (ARRAY['Admission follow-up completed','Student profile reviewed','Attendance session verified','Fee receipt reconciled','User access updated','Monthly report exported'])[1 + (gs % 6)],
    'Production-like Branch Admin activity log generated for trend testing.',
    'ba-seed-log-record-' || LPAD(gs::text, 3, '0'),
    u.id,
    u.branch_id,
    NOW() - ((gs % 60) * INTERVAL '1 day')
FROM generate_series(1, 180) gs
JOIN users_for_logs u ON u.rn = ((gs - 1) % 245) + 1;

COMMIT;

-- Expected dashboard counts
-- branches: 5
-- students: 200
-- admissions: 250
-- trainers: 20
-- counsellors: 10
-- staff_users: 15 non-trainer/non-counsellor staff
-- total_seeded_staff_accounts: 45 including trainers and counsellors
-- courses: 15
-- batches: 25
-- invoices: 200
-- payments: 185
-- activity_logs: 180
-- leads: 250
-- trainer_workload: 20

-- Verification SQL queries

SELECT 'branches' AS metric, COUNT(*) AS value FROM branches WHERE id LIKE 'ba-seed-branch-%'
UNION ALL SELECT 'students', COUNT(*) FROM users WHERE id LIKE 'ba-seed-student-%' AND role = 'STUDENT'::userrole
UNION ALL SELECT 'admissions', COUNT(*) FROM admissions WHERE id LIKE 'ba-seed-admission-%'
UNION ALL SELECT 'trainers', COUNT(*) FROM users WHERE id LIKE 'ba-seed-staff-%' AND role = 'TRAINER'::userrole
UNION ALL SELECT 'counsellors', COUNT(*) FROM users WHERE id LIKE 'ba-seed-staff-%' AND role = 'COUNSELLOR'::userrole
UNION ALL SELECT 'staff_users', COUNT(*) FROM users WHERE id LIKE 'ba-seed-staff-%' AND role IN ('BRANCH_ADMIN'::userrole,'FINANCE'::userrole,'HR'::userrole)
UNION ALL SELECT 'total_seeded_staff_accounts', COUNT(*) FROM users WHERE id LIKE 'ba-seed-staff-%'
UNION ALL SELECT 'courses', COUNT(*) FROM courses WHERE id LIKE 'ba-seed-course-%'
UNION ALL SELECT 'batches', COUNT(*) FROM batches WHERE id LIKE 'ba-seed-batch-%'
UNION ALL SELECT 'leads', COUNT(*) FROM leads WHERE id LIKE 'ba-seed-lead-%'
UNION ALL SELECT 'hr_employees', COUNT(*) FROM hr_employees WHERE id LIKE 'ba-seed-employee-%'
UNION ALL SELECT 'trainer_workload', COUNT(*) FROM trainer_workload WHERE id LIKE 'ba-seed-workload-%'
UNION ALL SELECT 'activity_logs', COUNT(*) FROM history_events WHERE id LIKE 'ba-seed-history-%';

SELECT
    COUNT(*) AS invoice_count,
    ROUND(SUM(amount)::numeric, 2) AS expected_fee_total,
    ROUND(SUM(paid_amount)::numeric, 2) AS collected_total,
    ROUND((SUM(amount) - SUM(paid_amount))::numeric, 2) AS outstanding_total
FROM invoices
WHERE id LIKE 'ba-seed-invoice-%';

SELECT
    COUNT(*) AS attendance_records,
    ROUND((COUNT(*) FILTER (WHERE status IN ('present','late')) * 100.0 / COUNT(*))::numeric, 2) AS attendance_percent,
    COUNT(*) FILTER (WHERE status = 'present') AS present_count,
    COUNT(*) FILTER (WHERE status = 'late') AS late_count,
    COUNT(*) FILTER (WHERE status = 'absent') AS absent_count
FROM attendance_records
WHERE id LIKE 'ba-seed-att-%';

SELECT
    b.name AS branch_name,
    COUNT(DISTINCT u.id) AS students,
    COUNT(DISTINCT a.id) AS admissions,
    ROUND(COALESCE(SUM(i.paid_amount), 0)::numeric, 2) AS fee_collected
FROM branches b
LEFT JOIN users u ON u.branch_id = b.id AND u.id LIKE 'ba-seed-student-%'
LEFT JOIN admissions a ON a.branch_id = b.id AND a.id LIKE 'ba-seed-admission-%'
LEFT JOIN invoices i ON i.branch_id = b.id AND i.id LIKE 'ba-seed-invoice-%'
WHERE b.id LIKE 'ba-seed-branch-%'
GROUP BY b.name
ORDER BY b.name;

SELECT
    DATE_TRUNC('week', created_at)::date AS week_start,
    COUNT(*) AS admissions,
    COUNT(*) FILTER (WHERE stage = 'Converted') AS converted
FROM admissions
WHERE id LIKE 'ba-seed-admission-%'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start;

SELECT
    DATE_TRUNC('week', paid_at)::date AS week_start,
    ROUND(SUM(amount)::numeric, 2) AS collections
FROM payments
WHERE reference_number LIKE 'BA-SEED-%'
GROUP BY DATE_TRUNC('week', paid_at)
ORDER BY week_start;

-- Testing checklist
-- 1. Login as a Branch Admin user, for example branch.admin31@pinesphere.com if auth accepts seeded password hashes.
-- 2. Open Branch Admin dashboard and confirm core counts match the verification query.
-- 3. Check branch filters: every branch should show 40 students and 50 admissions.
-- 4. Open Admissions: recent admissions should show counselling/application/converted/waitlisted/rejected stages.
-- 5. Open Students: records should include batch, course, trainer, document, and status values.
-- 6. Open Attendance: last 60 days should include present, late, and absent trends.
-- 7. Open Fees: collected total must equal SUM(payments.amount) and SUM(invoices.paid_amount).
-- 8. Open Reports: weekly admissions and weekly collections should show non-flat trends.
-- 9. Open Users: 20 trainers, 10 counsellors, 5 branch admins, 5 finance users, and 5 HR users should be visible.
-- 10. Open Activity Logs/History: latest Branch Admin actions should appear across admissions, students, attendance, fees, users, and reports.

-- Expected report outputs
-- Admissions conversion: 168 converted out of 250 total admissions = 67.20%.
-- Branch distribution: 5 branches, each with 40 students and 50 admissions.
-- Attendance trend: Monday/Wednesday/Friday sessions for the last 60 days, with present/late/absent variation.
-- Fee report: 145 fully paid invoices, 40 partial invoices, 15 unpaid invoices.
-- User report: 15 staff users plus 20 trainers and 10 counsellors, for 45 seeded staff accounts.
