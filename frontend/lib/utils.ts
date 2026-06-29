/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Utils
Purpose     : Provides Utils frontend logic and shared types
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
