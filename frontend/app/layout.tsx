/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Layout
Purpose     : Renders and coordinates Layout UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import type { Metadata } from "next";
import { AuthModal } from "@/components/auth/AuthModal";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinesphere ERP",
  description: "Super Admin dashboard for Pinesphere ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ToastProvider>
          {children}
          <AuthModal />
        </ToastProvider>
      </body>
    </html>
  );
}
