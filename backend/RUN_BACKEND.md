<!-- =====================================================
PINESPHERE ERP
Module      : Backend Platform
Document    : R U N B A C K E N D
Purpose     : Documents R U N B A C K E N D standards and implementation guidance
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== -->

<!-- =====================================================
SECTION: MODULE OVERVIEW
PURPOSE:
This section explains the purpose and rules documented in this file.
It gives beginner developers context before they read the details.
===================================================== -->

# Run Pinesphere Backend

Open PowerShell:

```powershell
cd E:\Pinesphere-ERP-AI-Training-Institute-main\backend
python scripts\seed_superadmin.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

Default login:

```text
Email: admin@pinesphere.com
Password: Admin@123
```

Database connection is in `.env`:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pinesphere_erp
```

Make sure PostgreSQL is running and the `pinesphere_erp` database exists.
