REM =====================================================
REM PINESPHERE ERP
REM Module      : Backend Platform
REM File        : run_backend.bat
REM Purpose     : Supports Run Backend project configuration
REM Author      : Pinesphere Development Team
REM Last Updated: Auto Generated
REM =====================================================

REM =====================================================
REM SECTION: SCRIPT COMMANDS
REM PURPOSE:
REM This section contains command-line steps executed by the script.
REM The commands start tools or automate setup tasks.
REM =====================================================

@echo off
cd /d "%~dp0"
python scripts\seed_superadmin.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
