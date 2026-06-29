<!-- =====================================================
PINESPHERE ERP
Module      : Backend Platform
Document    : D A T A B A S E T A B L E S
Purpose     : Documents D A T A B A S E T A B L E S standards and implementation guidance
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== -->

<!-- =====================================================
SECTION: MODULE OVERVIEW
PURPOSE:
This section explains the purpose and rules documented in this file.
It gives beginner developers context before they read the details.
===================================================== -->

# Pinesphere ERP Database Tables

The backend connects to PostgreSQL using `DATABASE_URL` in `backend/.env`.

Tables:
- `users`: all login accounts and roles.
- `refresh_tokens`: refresh tokens for login sessions.
- `auth_action_tokens`: hashed one-time tokens for password reset and email verification.
- `audit_logs`: login/logout/failed login history.
- `branches`: branch/campus records.
- `courses`, `lessons`, `enrollments`, `lesson_progress`: LMS learning data.
- `quizzes`, `quiz_questions`, `quiz_attempts`: quiz data.
- `attendance_sessions`, `attendance_records`: attendance data.

Endpoint groups:
- `/auth`
- `/profile`
- `/security`
- `/dashboard`
- `/branches`
- `/lms`
- `/attendance`
