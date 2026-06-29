<!-- =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Document    : Frontend Rules
Purpose     : Documents Frontend Rules standards and implementation guidance
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== -->

<!-- =====================================================
SECTION: MODULE OVERVIEW
PURPOSE:
This section explains the purpose and rules documented in this file.
It gives beginner developers context before they read the details.
===================================================== -->

Recommended Frontend Structure
src/
│
├── app/
├── components/
├── modules/
├── services/
├── hooks/
├── store/
├── lib/
├── types/
├── constants/
├── styles/
├── providers/
├── layouts/
└── assets/
4. App Router Rules

Pinesphere ERP must use:

Next.js App Router only
No Pages Router
No mixed routing system
5. App Router Structure
app/
│
├── (public)/
├── (auth)/
├── (dashboard)/
├── api/
├── layout.tsx
├── loading.tsx
├── error.tsx
└── not-found.tsx
6. Route Group Rules
Route Group	Purpose
(public)	Marketing pages
(auth)	Login/register
(dashboard)	Protected ERP system
api	API routes
7. Page Naming Rules
Mandatory Rules
Use kebab-case
Folder-based routing only
No camelCase pages
No PascalCase pages
Correct
student-management
course-builder
attendance-report
fees-dashboard
Forbidden
StudentManagement
studentManagement
AttendanceDashboard
8. Page File Rules

Every page must follow:

page.tsx
loading.tsx
error.tsx
layout.tsx

Only create files when required.

9. Component Architecture Rules
Component Types
Type	Location
Shared UI	components/ui
Shared Business UI	components/shared
Module UI	modules/*/components
Layout UI	layouts
10. Component Structure Standards
Example
modules/students/components/
├── student-table.tsx
├── student-form.tsx
├── student-card.tsx
└── student-filters.tsx
11. Component Rules
Mandatory
Single responsibility only
Maximum ~250 lines
Reusable logic extracted
No duplicated UI
No nested business logic
Forbidden
❌ DashboardFinal.tsx
❌ NewStudentTable.tsx
❌ StudentPageUpdated.tsx
❌ Massive 1500-line components
12. Client vs Server Component Rules
Default Rule

Use Server Components by default.

Use Client Components only when necessary.

Use Client Components Only For
State management
Forms
Browser APIs
Event handlers
Interactive UI
Required
"use client";

Only when absolutely necessary.

13. Server Component Rules

Server components should handle:

Data fetching
Initial rendering
SEO rendering
Layout rendering
Avoid
❌ Heavy client-side fetching
❌ Large client bundles
❌ Unnecessary hydration
14. ShadCN UI Rules

Pinesphere ERP must use:

ShadCN UI as primary component system
Tailwind utilities for styling
Radix primitives underneath

Source reference:

15. Allowed ShadCN Usage

Preferred components:

Button
Card
Dialog
Sheet
Table
Tabs
Dropdown
Form
Select
Toast
16. ShadCN Rules
Mandatory
Reuse existing components
Extend components instead of cloning
Centralize variants
Maintain consistent spacing
Forbidden
❌ Copying ShadCN components repeatedly
❌ Random component variants
❌ Inline custom UI chaos
17. Tailwind CSS Standards
Mandatory
Tailwind CSS only
Utility-first styling
Use cn() helper for conditional classes
Use design tokens consistently

Source reference:

18. Tailwind Class Rules
Preferred Order
Layout
Spacing
Typography
Colors
Effects
State
Example
className="
flex items-center gap-4
p-4 rounded-xl
text-sm font-medium
bg-background text-foreground
shadow-sm
hover:bg-muted
"
19. Forbidden Tailwind Patterns
❌ Massive unreadable class chains
❌ Random arbitrary values everywhere
❌ Inline styles
❌ Hardcoded colors repeatedly
20. Responsive Design Rules
Mandatory
Mobile-first design
Flexible layouts
Responsive typography
No horizontal overflow
Adaptive spacing
21. Breakpoint Standards
Breakpoint	Usage
sm	Small mobile
md	Tablet
lg	Desktop
xl	Large desktop
Example
grid-cols-1 md:grid-cols-2 lg:grid-cols-4
22. Dashboard Layout Standards

ERP dashboards must follow consistent layout structure.

23. Dashboard Page Structure
DashboardLayout
│
├── Header
├── Sidebar
├── PageToolbar
├── ContentArea
└── Footer
24. Dashboard Layout Rules
Mandatory
Sticky sidebar
Responsive collapse
Consistent spacing
Scroll-safe content
Mobile navigation drawer
Forbidden
❌ Random dashboard layouts
❌ Full-page scrolling chaos
❌ Fixed-width dashboards
❌ Hidden overflow bugs
25. Sidebar Standards

Sidebar must support:

Role-based navigation
Nested navigation
Collapse state
Mobile drawer mode
Active route highlighting
26. Dashboard Card Standards

Dashboard cards must contain:

Title
Description
Main metric
Optional actions
Loading state
Empty state
Example Structure
Card
├── CardHeader
├── CardContent
└── CardFooter
27. Table Standards

All ERP tables must support:

Pagination
Search
Empty state
Loading state
Responsive overflow
Sorting
Filters
28. Form Standards
Mandatory
React Hook Form
Zod validation
Inline errors
Disabled submit during loading
Proper labels
Forbidden
❌ Placeholder-only forms
❌ No validation
❌ Browser default alerts
29. State Management Rules

Use Zustand only for:

Authentication
Sidebar state
Theme
Persistent session state
Avoid Global State For
Form fields
Modal open state
Temporary UI state

Use local component state instead.

Source reference:

30. API Integration Rules
Mandatory
Use service layer
No direct fetch inside UI
Centralized API client
Typed responses only
Structure
services/
├── api-client.ts
├── auth-api.ts
├── student-api.ts
└── fees-api.ts
31. Loading State Standards

Every page must handle:

Skeleton loading
Empty state
Error state
Retry state
Forbidden
❌ Blank screens during loading
❌ Infinite spinners everywhere
❌ Unhandled fetch failures
32. Error Handling Standards

Frontend must handle:

Unauthorized access
Network failures
Validation errors
API failures
Session expiration
33. Typography Standards
Mandatory
Consistent text hierarchy
Limited font weights
Consistent line height
Responsive font sizes
Recommended Scale
Usage	Class
Page title	text-3xl
Section title	text-xl
Card title	text-lg
Body text	text-sm
Caption	text-xs
34. Animation Rules
Allowed
Subtle transitions
Loading animations
Hover feedback
Dialog transitions
Forbidden
❌ Heavy animations everywhere
❌ Performance-heavy effects
❌ Distracting motion
35. Accessibility Standards
Mandatory
Keyboard navigation
Proper labels
Focus states
Semantic HTML
ARIA support where needed
36. Performance Rules
Required
Dynamic imports
Lazy loading
Optimized images
Small bundles
Minimized client components
Use
next/image
next/dynamic
37. Frontend Security Rules
Mandatory
Sanitize user content
Protect admin routes
Validate forms
Handle auth securely
Forbidden
❌ Exposing secrets
❌ Client-side trust only
❌ Unsafe HTML rendering
38. AI-Friendly Frontend Rules

Since AI-assisted development is heavily used:

Components Must Be
Predictable
Modular
Reusable
Small
Explicitly typed
Avoid
❌ Giant magic components
❌ Hidden logic
❌ Random abstractions
❌ Confusing naming
39. MVP Frontend Discipline

For MVP phase:

Prioritize
Speed
Simplicity
Stability
Clean UX
Avoid
❌ Premature optimization
❌ Fancy architecture
❌ Over-abstracted components
❌ Unnecessary state management
40. Final Frontend Philosophy

The Pinesphere ERP frontend should feel:

Modern
Fast
Clean
Enterprise-grade
Mobile-first
AI-assisted
Easy to scale
Easy to maintain

Every frontend engineer and AI agent must prioritize maintainability and consistency over personal coding style.