"""
PINESPHERE ERP
Module      : Project Documentation
File        : standardize_banners.py
Purpose     : Provides Standardize Banners backend functionality
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

from __future__ import annotations

from pathlib import Path
import re


# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

ROOT = Path(__file__).resolve().parents[1]

EXCLUDED_PARTS = {
    ".git",
    ".next",
    "node_modules",
    "__pycache__",
    "video_tools",
    "video_frames",
}

COMMENTABLE_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".css",
    ".mjs",
    ".md",
    ".bat",
    ".ini",
    ".mako",
    ".prisma",
    ".example",
}

SECTION_PURPOSES = {
    "IMPORTS": (
        "This section loads external libraries, framework tools, and local helpers.",
        "Keeping imports together makes dependencies easy to review.",
    ),
    "CONSTANTS": (
        "This section stores fixed values used by the file.",
        "Centralizing these values helps avoid repeated magic strings or numbers.",
    ),
    "TYPES AND INTERFACES": (
        "This section describes the shape of data used by the code.",
        "Clear types make component props, API payloads, and state easier to understand.",
    ),
    "STATE MANAGEMENT": (
        "This section stores temporary UI data such as loading, errors, filters, and form values.",
        "State changes here control what the user sees on the screen.",
    ),
    "API CALLS": (
        "This section talks to backend or server endpoints.",
        "It sends requests, receives responses, and prepares data for the UI.",
    ),
    "FORM VALIDATION": (
        "This section checks user input before it is submitted.",
        "Validation keeps forms predictable and helps show useful error messages.",
    ),
    "EVENT HANDLERS": (
        "This section responds to user actions such as clicks, typing, and form submission.",
        "Handlers connect interface events to state updates or API calls.",
    ),
    "UI RENDERING": (
        "This section returns the visual layout shown to the user.",
        "It combines data, state, and components into the final screen.",
    ),
    "GLOBAL THEME": (
        "This section defines shared styling used across the frontend.",
        "Global styles keep colors, spacing, and layout behavior consistent.",
    ),
    "DATABASE MODELS": (
        "This section defines database table structures.",
        "Each model maps Python objects to rows stored by the database.",
    ),
    "SCHEMAS": (
        "This section defines request and response data shapes.",
        "Schemas validate incoming data and document what endpoints return.",
    ),
    "SERVICES": (
        "This section contains business logic used by routes or other modules.",
        "Services keep workflows separate from request handling code.",
    ),
    "REPOSITORIES": (
        "This section contains database access helpers.",
        "Repository code keeps storage queries separate from business rules.",
    ),
    "ROUTES AND ENDPOINTS": (
        "This section defines HTTP endpoints exposed by the backend.",
        "Routes receive requests, call services, and return API responses.",
    ),
    # =====================================================
    # SECTION: MIDDLEWARE
    # PURPOSE:
    # This section runs shared request or response logic.
    # Middleware is useful for security, logging, sessions, and cross-cutting behavior.
    # =====================================================

    "MIDDLEWARE": (
        "This section runs shared request or response logic.",
        "Middleware is useful for security, logging, sessions, and cross-cutting behavior.",
    ),
    "ERROR HANDLING": (
        "This section handles expected failures and converts them into useful responses.",
        "Good error handling keeps the app stable when something goes wrong.",
    ),
    "LOGGING": (
        "This section records useful runtime information for debugging and audits.",
        "Logs help developers understand what happened during a request or task.",
    ),
    "HELPER FUNCTIONS": (
        "This section contains small reusable utilities used by the file.",
        "Helpers keep repeated logic in one clear place.",
    ),
    "MODULE OVERVIEW": (
        "This section explains the purpose and rules documented in this file.",
        "It gives beginner developers context before they read the details.",
    ),
    "CONFIGURATION": (
        "This section stores project or tool settings.",
        "These values control how the app, build tools, or scripts behave.",
    ),
    "DATABASE SCHEMA": (
        "This section describes the database structure used by Prisma.",
        "It defines models, fields, and relationships for stored data.",
    ),
    "SCRIPT COMMANDS": (
        "This section contains command-line steps executed by the script.",
        "The commands start tools or automate setup tasks.",
    ),
    "TEMPLATE OUTPUT": (
        "This section defines generated file content.",
        "The template is used by tooling to create repeatable code files.",
    ),
}

GENERATED_SECTION_LABELS = set(SECTION_PURPOSES)

SKIPPED_FILES = {
    "frontend/next-env.d.ts",
    "frontend/package-lock.json",
    "frontend/package.json",
    "frontend/tsconfig.json",
    "frontend/components.json",
    "frontend/prisma.config.ts",  # kept commentable via .ts handling below
}

MODULE_KEYWORDS = (
    ("admission", "Admission Module"),
    ("student", "Student Module"),
    ("attendance", "Attendance Module"),
    ("fee", "Fees Module"),
    ("finance", "Fees Module"),
    ("lms", "LMS Module"),
    ("users", "Users Module"),
    ("user", "Users Module"),
    ("branch", "Branches Module"),
    ("report", "Reports Module"),
    ("ai", "AI Module"),
    ("hr", "HR Module"),
    ("crm", "Admission Module"),
    ("auth", "Authentication Module"),
    ("profile", "Profile Module"),
    ("security", "Security Module"),
    ("settings", "Settings Module"),
    ("dashboard", "Dashboard Module"),
)


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    rel_parts = set(Path(rel).parts)
    if rel in SKIPPED_FILES and rel != "frontend/prisma.config.ts":
        return True
    if any(part in EXCLUDED_PARTS for part in rel_parts):
        return True
    if path.suffix.lower() in {".png", ".ico", ".svg", ".pyc", ".lock", ".json"}:
        return True
    if path.name == "README" or path.name == ".gitkeep":
        return False
    return path.suffix.lower() in COMMENTABLE_EXTENSIONS


def title_from_name(value: str) -> str:
    value = re.sub(r"[_\-.]+", " ", value)
    value = re.sub(r"(?<!^)(?=[A-Z])", " ", value)
    return " ".join(part.capitalize() for part in value.split())


def module_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix().lower()
    tokens = set(re.split(r"[^a-z0-9]+", rel))
    for keyword, module in MODULE_KEYWORDS:
        if keyword in tokens:
            return module
    if rel.startswith("frontend/"):
        return "Frontend Platform"
    if rel.startswith("backend/"):
        return "Backend Platform"
    return "Project Documentation"


def purpose_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    stem = title_from_name(path.stem or path.name)
    if path.suffix == ".tsx":
        return f"Renders and coordinates {stem} UI behavior"
    if path.suffix == ".ts":
        return f"Provides {stem} frontend logic and shared types"
    if path.suffix == ".css":
        return "Defines centralized Pinesphere ERP theme and global styles"
    if path.suffix == ".py":
        if "/api/" in rel.replace("\\", "/"):
            return f"Defines {stem} API endpoints and request handling"
        if "/models/" in rel.replace("\\", "/"):
            return f"Defines {stem} database models"
        if "/schemas/" in rel.replace("\\", "/"):
            return f"Defines {stem} request and response schemas"
        if "/services/" in rel.replace("\\", "/"):
            return f"Provides {stem} business logic"
        return f"Provides {stem} backend functionality"
    if path.suffix == ".md":
        return f"Documents {stem} standards and implementation guidance"
    return f"Supports {stem} project configuration"


def slash_banner(path: Path) -> str:
    stem = title_from_name(path.stem or path.name)
    return (
        "/* =====================================================\n"
        "PINESPHERE ERP\n"
        f"Module      : {module_for(path)}\n"
        f"Component   : {stem}\n"
        f"Purpose     : {purpose_for(path)}\n"
        "Author      : Pinesphere Development Team\n"
        "Last Updated: Auto Generated\n"
        "===================================================== */\n\n"
    )


def python_banner(path: Path) -> str:
    stem = path.name
    return (
        '"""\n'
        "PINESPHERE ERP\n"
        f"Module      : {module_for(path)}\n"
        f"File        : {stem}\n"
        f"Purpose     : {purpose_for(path)}\n"
        "Author      : Pinesphere Development Team\n"
        "Last Updated: Auto Generated\n"
        "=====================================================\n"
        '"""\n\n'
    )


def hash_banner(path: Path) -> str:
    stem = path.name
    return (
        "# =====================================================\n"
        "# PINESPHERE ERP\n"
        f"# Module      : {module_for(path)}\n"
        f"# File        : {stem}\n"
        f"# Purpose     : {purpose_for(path)}\n"
        "# Author      : Pinesphere Development Team\n"
        "# Last Updated: Auto Generated\n"
        "# =====================================================\n\n"
    )


def html_banner(path: Path) -> str:
    stem = title_from_name(path.stem or path.name)
    return (
        "<!-- =====================================================\n"
        "PINESPHERE ERP\n"
        f"Module      : {module_for(path)}\n"
        f"Document    : {stem}\n"
        f"Purpose     : {purpose_for(path)}\n"
        "Author      : Pinesphere Development Team\n"
        "Last Updated: Auto Generated\n"
        "===================================================== -->\n\n"
    )


def rem_banner(path: Path) -> str:
    return (
        "REM =====================================================\n"
        "REM PINESPHERE ERP\n"
        f"REM Module      : {module_for(path)}\n"
        f"REM File        : {path.name}\n"
        f"REM Purpose     : {purpose_for(path)}\n"
        "REM Author      : Pinesphere Development Team\n"
        "REM Last Updated: Auto Generated\n"
        "REM =====================================================\n\n"
    )


def ini_banner(path: Path) -> str:
    return (
        "; =====================================================\n"
        "; PINESPHERE ERP\n"
        f"; Module      : {module_for(path)}\n"
        f"; File        : {path.name}\n"
        f"; Purpose     : {purpose_for(path)}\n"
        "; Author      : Pinesphere Development Team\n"
        "; Last Updated: Auto Generated\n"
        "; =====================================================\n\n"
    )


def banner_for(path: Path) -> str:
    if path.suffix == ".py":
        return python_banner(path)
    if path.suffix in {".ts", ".tsx", ".css", ".mjs"}:
        return slash_banner(path)
    if path.suffix == ".md" or path.name == "README":
        return html_banner(path)
    if path.suffix == ".bat":
        return rem_banner(path)
    if path.suffix == ".ini":
        return ini_banner(path)
    if path.suffix == ".mako":
        return (
            "## =====================================================\n"
            "## PINESPHERE ERP\n"
            f"## Module      : {module_for(path)}\n"
            f"## File        : {path.name}\n"
            f"## Purpose     : {purpose_for(path)}\n"
            "## Author      : Pinesphere Development Team\n"
            "## Last Updated: Auto Generated\n"
            "## =====================================================\n\n"
        )
    if path.suffix == ".prisma":
        return (
            "// =====================================================\n"
            "// PINESPHERE ERP\n"
            f"// Module      : {module_for(path)}\n"
            f"// File        : {path.name}\n"
            f"// Purpose     : {purpose_for(path)}\n"
            "// Author      : Pinesphere Development Team\n"
            "// Last Updated: Auto Generated\n"
            "// =====================================================\n\n"
        )
    if path.suffix == ".example":
        return hash_banner(path)
    return hash_banner(path)


def strip_existing_header(text: str) -> str:
    def drop_block_once(value: str, start: str, end: str, required_second: str | None = None) -> tuple[str, bool]:
        lines = value.splitlines(keepends=True)
        if not lines or lines[0].strip() != start:
            return value, False
        if required_second and (len(lines) < 2 or lines[1].strip() != required_second):
            return value, False
        for index, line in enumerate(lines[1:], start=1):
            if line.strip() == end:
                next_index = index + 1
                while next_index < len(lines) and not lines[next_index].strip():
                    next_index += 1
                return "".join(lines[next_index:]), True
        return value, False

    block_specs = (
        ("/* =====================================================", "===================================================== */", "PINESPHERE ERP"),
        ("<!-- =====================================================", "===================================================== -->", "PINESPHERE ERP"),
        ('"""', '"""', "PINESPHERE ERP"),
        ("# =====================================================", "# =====================================================", "# PINESPHERE ERP"),
        ("REM =====================================================", "REM =====================================================", "REM PINESPHERE ERP"),
        ("; =====================================================", "; =====================================================", "; PINESPHERE ERP"),
        ("## =====================================================", "## =====================================================", "## PINESPHERE ERP"),
        ("// =====================================================", "// =====================================================", "// PINESPHERE ERP"),
        ("## # =====================================================", "## # =====================================================", "## # PINESPHERE ERP"),
        ("// # =====================================================", "// # =====================================================", "// # PINESPHERE ERP"),
    )

    changed = True
    while changed:
        changed = False
        for start, end, required_second in block_specs:
            text, removed = drop_block_once(text, start, end, required_second)
            changed = changed or removed

        old_frontend = text.startswith("/* ============================================================")
        if old_frontend:
            end_index = text.find("============================================================ */")
            if end_index >= 0:
                end_index += len("============================================================ */")
                text = text[end_index:].lstrip()
                changed = True

    return text


def section_banner(label: str, style: str, indent: str = "") -> str:
    purpose = SECTION_PURPOSES.get(
        label,
        (
            "This section groups related code so the file is easier to read.",
            "Keeping sections clear helps new developers find the right logic quickly.",
        ),
    )
    if style == "slash":
        return (
            f"{indent}/* =====================================================\n"
            f"{indent}   SECTION: {label}\n"
            f"{indent}   PURPOSE:\n"
            f"{indent}   {purpose[0]}\n"
            f"{indent}   {purpose[1]}\n"
            f"{indent}===================================================== */\n\n"
        )
    if style == "css":
        return (
            f"{indent}/* =====================================================\n"
            f"{indent}   SECTION: {label}\n"
            f"{indent}   PURPOSE:\n"
            f"{indent}   {purpose[0]}\n"
            f"{indent}   {purpose[1]}\n"
            f"{indent}===================================================== */\n\n"
        )
    if style == "python":
        return (
            f"{indent}# =====================================================\n"
            f"{indent}# SECTION: {label}\n"
            f"{indent}# PURPOSE:\n"
            f"{indent}# {purpose[0]}\n"
            f"{indent}# {purpose[1]}\n"
            f"{indent}# =====================================================\n\n"
        )
    if style == "html":
        return (
            f"{indent}<!-- =====================================================\n"
            f"{indent}SECTION: {label}\n"
            f"{indent}PURPOSE:\n"
            f"{indent}{purpose[0]}\n"
            f"{indent}{purpose[1]}\n"
            f"{indent}===================================================== -->\n\n"
        )
    if style == "rem":
        return (
            f"{indent}REM =====================================================\n"
            f"{indent}REM SECTION: {label}\n"
            f"{indent}REM PURPOSE:\n"
            f"{indent}REM {purpose[0]}\n"
            f"{indent}REM {purpose[1]}\n"
            f"{indent}REM =====================================================\n\n"
        )
    if style == "ini":
        return (
            f"{indent}; =====================================================\n"
            f"{indent}; SECTION: {label}\n"
            f"{indent}; PURPOSE:\n"
            f"{indent}; {purpose[0]}\n"
            f"{indent}; {purpose[1]}\n"
            f"{indent}; =====================================================\n\n"
        )
    if style == "mako":
        return (
            f"{indent}## =====================================================\n"
            f"{indent}## SECTION: {label}\n"
            f"{indent}## PURPOSE:\n"
            f"{indent}## {purpose[0]}\n"
            f"{indent}## {purpose[1]}\n"
            f"{indent}## =====================================================\n\n"
        )
    if style == "prisma":
        return (
            f"{indent}// =====================================================\n"
            f"{indent}// SECTION: {label}\n"
            f"{indent}// PURPOSE:\n"
            f"{indent}// {purpose[0]}\n"
            f"{indent}// {purpose[1]}\n"
            f"{indent}// =====================================================\n\n"
        )
    return ""


def strip_existing_sections(text: str) -> str:
    lines = text.splitlines(keepends=True)
    output: list[str] = []
    index = 0

    while index < len(lines):
        line = lines[index].strip()
        next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
        starts_banner = line in {
            "/* =====================================================",
            "// =====================================================",
            "# =====================================================",
            "<!-- =====================================================",
            "REM =====================================================",
            "; =====================================================",
            "## =====================================================",
        }

        if starts_banner and _looks_like_generated_section(lines, index):
            index += 1
            while index < len(lines) and "=====================================================" not in lines[index]:
                index += 1
            if index < len(lines):
                index += 1
            while index < len(lines) and not lines[index].strip():
                index += 1
            continue

        if line.startswith("/* =====================================================") and _looks_like_generated_section(lines, index):
            index += 1
            while index < len(lines) and "===================================================== */" not in lines[index]:
                index += 1
            if index < len(lines):
                index += 1
            while index < len(lines) and not lines[index].strip():
                index += 1
            continue

        if line.startswith("<!-- =====================================================") and _looks_like_generated_section(lines, index):
            index += 1
            while index < len(lines) and "===================================================== -->" not in lines[index]:
                index += 1
            if index < len(lines):
                index += 1
            while index < len(lines) and not lines[index].strip():
                index += 1
            continue

        if next_line in GENERATED_SECTION_LABELS:
            index += 1
            while index < len(lines) and "=====================================================" not in lines[index]:
                index += 1
            if index < len(lines):
                index += 1
            while index < len(lines) and not lines[index].strip():
                index += 1
            continue

        output.append(lines[index])
        index += 1

    return "".join(output)


def _looks_like_generated_section(lines: list[str], start: int) -> bool:
    preview = "".join(lines[start : start + 8])
    if "PINESPHERE ERP" in preview:
        return False
    if "SECTION:" in preview:
        return True
    return any(label in preview for label in GENERATED_SECTION_LABELS)


def line_indent(line: str) -> str:
    return re.match(r"\s*", line).group(0)


def insert_banner_before_first(
    lines: list[str],
    label: str,
    style: str,
    predicate,
    used: set[str],
    start_at: int = 0,
) -> None:
    if label in used:
        return
    for index in range(start_at, len(lines)):
        if predicate(lines[index], index):
            lines.insert(index, section_banner(label, style, line_indent(lines[index])))
            used.add(label)
            return


def add_frontend_sections(path: Path, text: str) -> str:
    lines = text.splitlines(keepends=True)
    used: set[str] = set()
    start_at = 0
    if lines and lines[0].strip() in {'"use client";', "'use client';"}:
        start_at = 1

    insert_banner_before_first(
        lines,
        "IMPORTS",
        "slash",
        lambda line, _: line.lstrip().startswith("import "),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "TYPES AND INTERFACES",
        "slash",
        lambda line, _: bool(re.match(r"\s*(export\s+)?(type|interface)\s+\w+", line)),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "CONSTANTS",
        "slash",
        lambda line, _: bool(re.match(r"\s*(export\s+)?const\s+[A-Z0-9_]+\s*=", line)),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "STATE MANAGEMENT",
        "slash",
        lambda line, _: "useState(" in line or "useReducer(" in line or "create<" in line or " create(" in line,
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "API CALLS",
        "slash",
        lambda line, _: any(token in line for token in ("fetch(", "apiRequest", "axios.", "API_BASE", "NEXT_PUBLIC_API")),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "FORM VALIDATION",
        "slash",
        lambda line, _: bool(re.search(r"\b(validate|validation|fieldErrors|formErrors|setErrors)\b", line, re.I)),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "EVENT HANDLERS",
        "slash",
        lambda line, _: bool(
            re.match(r"\s*(const|let|var)\s+(handle[A-Z]\w*|onSubmit|onClick|onChange|onOpenChange)\s*=", line)
            or re.match(r"\s*(async\s+)?function\s+(handle[A-Z]\w*|onSubmit|onClick|onChange|onOpenChange)\b", line)
        ),
        used,
        start_at,
    )
    if path.suffix == ".tsx":
        insert_banner_before_first(
            lines,
            "UI RENDERING",
            "slash",
            lambda line, _: bool(re.match(r"\s*return\s*(\(|<)", line)),
            used,
            start_at,
        )
    insert_banner_before_first(
        lines,
        "HELPER FUNCTIONS",
        "slash",
        lambda line, _: bool(re.match(r"\s*(export\s+)?(async\s+)?function\s+\w+", line))
        or bool(re.match(r"\s*(export\s+)?const\s+[a-z]\w*\s*=\s*(async\s*)?\(", line)),
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "ERROR HANDLING",
        "slash",
        lambda line, _: "catch (" in line or ".catch(" in line or "throw new Error" in line,
        used,
        start_at,
    )
    insert_banner_before_first(
        lines,
        "LOGGING",
        "slash",
        # =====================================================
        # SECTION: LOGGING
        # PURPOSE:
        # This section records useful runtime information for debugging and audits.
        # Logs help developers understand what happened during a request or task.
        # =====================================================

        lambda line, _: "console." in line or "logger." in line,
        used,
        start_at,
    )
    if not used:
        lines.insert(start_at, section_banner("CONFIGURATION", "slash"))
    return "".join(lines)


def add_python_sections(path: Path, text: str) -> str:
    lines = text.splitlines(keepends=True)
    used: set[str] = set()
    rel = path.relative_to(ROOT).as_posix()

    insert_banner_before_first(
        lines,
        "IMPORTS",
        "python",
        lambda line, _: bool(re.match(r"\s*(from\s+\S+\s+import|import\s+\S+)", line)),
        used,
    )
    insert_banner_before_first(
        lines,
        "LOGGING",
        "python",
        lambda line, _: "logger" in line or "logging." in line,
        used,
    )
    insert_banner_before_first(
        lines,
        "CONSTANTS",
        "python",
        lambda line, _: bool(re.match(r"\s*[A-Z][A-Z0-9_]+\s*=", line)),
        used,
    )
    if "/models/" in rel:
        insert_banner_before_first(
            lines,
            "DATABASE MODELS",
            "python",
            lambda line, _: bool(re.match(r"\s*class\s+\w+", line)),
            used,
        )
    if "/schemas/" in rel:
        insert_banner_before_first(
            lines,
            "SCHEMAS",
            "python",
            lambda line, _: bool(re.match(r"\s*class\s+\w+", line)),
            used,
        )
    if "/api/" in rel or path.name == "main.py":
        insert_banner_before_first(
            lines,
            "ROUTES AND ENDPOINTS",
            "python",
            lambda line, _: bool(re.match(r"\s*@\w*router\.(get|post|put|patch|delete)", line))
            or bool(re.match(r"\s*@app\.(get|post|put|patch|delete)", line)),
            used,
        )
    insert_banner_before_first(
        lines,
        "MIDDLEWARE",
        "python",
        lambda line, _: "middleware" in line.lower() or "CORSMiddleware" in line,
        used,
    )
    if "/services/" in rel or "/auth/" in rel:
        insert_banner_before_first(
            lines,
            "SERVICES",
            "python",
            lambda line, _: bool(re.match(r"\s*(async\s+)?def\s+\w+", line)) or bool(re.match(r"\s*class\s+\w+", line)),
            used,
        )
    insert_banner_before_first(
        lines,
        "API CALLS",
        "python",
        # =====================================================
        # SECTION: API CALLS
        # PURPOSE:
        # This section talks to backend or server endpoints.
        # It sends requests, receives responses, and prepares data for the UI.
        # =====================================================

        lambda line, _: any(token in line for token in ("requests.", "httpx.", "AsyncClient", "client.")),
        used,
    )
    insert_banner_before_first(
        lines,
        "ERROR HANDLING",
        "python",
        # =====================================================
        # SECTION: ERROR HANDLING
        # PURPOSE:
        # This section handles expected failures and converts them into useful responses.
        # Good error handling keeps the app stable when something goes wrong.
        # =====================================================

        lambda line, _: bool(re.match(r"\s*except\b", line)) or "HTTPException" in line or "raise " in line,
        used,
    )
    insert_banner_before_first(
        lines,
        "HELPER FUNCTIONS",
        "python",
        lambda line, _: bool(re.match(r"\s*(async\s+)?def\s+\w+", line)),
        used,
    )
    if not used:
        lines.insert(0, section_banner("MODULE OVERVIEW", "python"))
    return "".join(lines)


def add_prisma_sections(text: str) -> str:
    lines = text.splitlines(keepends=True)
    used: set[str] = set()
    insert_banner_before_first(lines, "DATABASE SCHEMA", "prisma", lambda line, _: bool(re.match(r"\s*(generator|datasource|model)\s+", line)), used)
    if not used:
        lines.insert(0, section_banner("DATABASE SCHEMA", "prisma"))
    return "".join(lines)


def add_section(path: Path, text: str) -> str:
    if path.suffix in {".ts", ".tsx", ".mjs"}:
        return add_frontend_sections(path, text)
    if path.suffix == ".css":
        return section_banner("GLOBAL THEME", "css") + text
    if path.suffix == ".py":
        return add_python_sections(path, text)
    if path.suffix == ".md":
        return section_banner("MODULE OVERVIEW", "html") + text
    if path.suffix == ".bat":
        return section_banner("SCRIPT COMMANDS", "rem") + text
    if path.suffix == ".ini" or path.suffix == ".example":
        return section_banner("CONFIGURATION", "ini") + text
    if path.suffix == ".mako":
        return section_banner("TEMPLATE OUTPUT", "mako") + text
    if path.suffix == ".prisma":
        return add_prisma_sections(text)
    return text


def collapse_duplicate_sections(text: str) -> str:
    css_section = "/* =====================================================\nGLOBAL THEME\n===================================================== */\n\n"
    while css_section + css_section in text:
        text = text.replace(css_section + css_section, css_section)
    return text


def normalize(path: Path) -> bool:
    try:
        raw = path.read_bytes()
    except OSError:
        return False
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return False
    original = text
    text = strip_existing_header(text)
    text = strip_existing_sections(text)
    text = collapse_duplicate_sections(banner_for(path) + add_section(path, text.lstrip()))
    if text != original:
        path.write_text(text, encoding="utf-8", newline="")
        return True
    return False


def clean_json_if_needed(path: Path) -> bool:
    if path.suffix.lower() != ".json":
        return False
    try:
        raw = path.read_bytes()
    except OSError:
        return False
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return False
    cleaned = strip_existing_header(strip_existing_sections(text))
    if cleaned != text:
        path.write_text(cleaned, encoding="utf-8", newline="")
        return True
    return False


def main() -> None:
    changed = []
    scan_roots = [
        ROOT / "backend",
        ROOT / "docs",
        ROOT / "frontend" / "app",
        ROOT / "frontend" / "components",
        ROOT / "frontend" / "lib",
        ROOT / "frontend" / "store",
        ROOT / "frontend" / "prisma",
        ROOT / "scripts",
        ROOT / "frontend" / "README.md",
        ROOT / "frontend" / "AGENTS.md",
        ROOT / "frontend" / "CLAUDE.md",
        ROOT / "frontend" / "frontend-rules.md",
        ROOT / "frontend" / "eslint.config.mjs",
        ROOT / "frontend" / "next.config.ts",
        ROOT / "frontend" / "postcss.config.mjs",
        ROOT / "frontend" / "prisma.config.ts",
    ]
    paths: list[Path] = []
    for root in scan_roots:
        if not root.exists():
            continue
        if root.is_file():
            paths.append(root)
        else:
            paths.extend(root.rglob("*"))
    for path in sorted(set(paths)):
        if not path.is_file():
            continue
        if clean_json_if_needed(path):
            changed.append(path.relative_to(ROOT).as_posix())
            continue
        if not should_skip(path):
            continue
        if normalize(path):
            changed.append(path.relative_to(ROOT).as_posix())
    print(f"standardized {len(changed)} files")
    for rel in changed:
        print(rel)


if __name__ == "__main__":
    main()
