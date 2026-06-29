"""
PINESPHERE ERP
Module      : AI Module
File        : ai.py
Purpose     : Defines Ai request and response schemas
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

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class AiChatRequest(BaseModel):
    message: str


class AiChatResponse(BaseModel):
    answer: str
    suggestions: list[str]
