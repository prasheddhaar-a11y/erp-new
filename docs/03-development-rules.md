<!-- =====================================================
PINESPHERE ERP
Module      : Project Documentation
Document    : 03 Development Rules
Purpose     : Documents 03 Development Rules standards and implementation guidance
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== -->

<!-- =====================================================
SECTION: MODULE OVERVIEW
PURPOSE:
This section explains the purpose and rules documented in this file.
It gives beginner developers context before they read the details.
===================================================== -->

# Pinesphere ERP Development Rules

---

# 1. Purpose

This document defines the engineering standards, coding rules, architecture discipline, and workflow conventions for the Pinesphere ERP platform.

The goal is to maintain:

- Clean architecture
- Predictable code structure
- Scalable development
- Team consistency
- AI-agent-friendly workflows
- Maintainable enterprise codebase

This workflow is inspired by structured engineering systems such as:

- Karpathy-style engineering workflows
- Modern AI-assisted development pipelines
- Monorepo engineering standards
- Enterprise SaaS architecture practices

---

# 2. Core Engineering Principles

## Always Prioritize

- Simplicity over cleverness
- Reusability over duplication
- Readability over shortcuts
- Scalability over temporary hacks
- Consistency over personal preference

---

## Never Allow

- Duplicate components
- Random folder creation
- Hardcoded API URLs
- Inline business logic inside UI
- Massive component files
- Unused dependencies
- Dead code
- Mixed coding styles

---

# 3. Project Folder Structure Rules

## Standard Frontend Structure

```text id="m7kq2n"
src/
│
├── app/
├── components/
├── modules/
├── services/
├── hooks/
├── store/
├── lib/
├── utils/
├── types/
├── constants/
├── styles/
├── providers/
├── layouts/
├── config/
└── assets/