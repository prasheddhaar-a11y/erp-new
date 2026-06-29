<!-- =====================================================
PINESPHERE ERP
Module      : Project Documentation
Document    : Responsive U I
Purpose     : Documents Responsive U I standards and implementation guidance
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== -->

<!-- =====================================================
SECTION: MODULE OVERVIEW
PURPOSE:
This section explains the purpose and rules documented in this file.
It gives beginner developers context before they read the details.
===================================================== -->

# Responsive UI Guidelines
### Device-Specific Pixel Rules — Mobile · Tablet · Laptop · Desktop

> No color definitions in this file.
> This file covers only: breakpoints, pixel sizes, layout rules, touch targets, and functional interaction specs for all devices.

---

## Table of Contents

1. [Device Breakpoints](#1-device-breakpoints)
2. [Typography — Pixel Sizes Per Device](#2-typography--pixel-sizes-per-device)
3. [Spacing — Pixel Values Per Device](#3-spacing--pixel-values-per-device)
4. [Container & Layout Widths](#4-container--layout-widths)
5. [Navbar — Height & Behavior Per Device](#5-navbar--height--behavior-per-device)
6. [Sidebar — Width & Behavior Per Device](#6-sidebar--width--behavior-per-device)
7. [Button — Size & Touch Rules Per Device](#7-button--size--touch-rules-per-device)
8. [Input & Form — Size Per Device](#8-input--form--size-per-device)
9. [Card — Padding & Grid Per Device](#9-card--padding--grid-per-device)
10. [Table — Behavior Per Device](#10-table--behavior-per-device)
11. [Modal — Width Per Device](#11-modal--width-per-device)
12. [Grid Columns Per Device](#12-grid-columns-per-device)
13. [Touch Screen — Functional Rules](#13-touch-screen--functional-rules)
14. [Touch Targets — All Interactive Elements](#14-touch-targets--all-interactive-elements)
15. [Navigation — Touch Behavior Per Device](#15-navigation--touch-behavior-per-device)
16. [Gestures & Interactions Per Device](#16-gestures--interactions-per-device)
17. [Scroll Behavior Per Device](#17-scroll-behavior-per-device)
18. [Keyboard & Input Behavior Per Device](#18-keyboard--input-behavior-per-device)
19. [Device-Specific Functional Rules](#19-device-specific-functional-rules)
20. [Functional Checklist Per Device](#20-functional-checklist-per-device)

---

## 1. Device Breakpoints

All breakpoints are **min-width** based (mobile-first). Write base styles for the smallest screen first, then override for larger screens.

| Device           | Breakpoint (min-width) | Max Width  | CSS Media Query                        |
|------------------|------------------------|------------|----------------------------------------|
| Mobile Small     | 320px                  | 479px      | `@media (min-width: 320px)`            |
| Mobile           | 480px                  | 767px      | `@media (min-width: 480px)`            |
| Tablet           | 768px                  | 1023px     | `@media (min-width: 768px)`            |
| Laptop           | 1024px                 | 1279px     | `@media (min-width: 1024px)`           |
| Desktop          | 1280px                 | 1439px     | `@media (min-width: 1280px)`           |
| Large Desktop    | 1440px                 | unlimited  | `@media (min-width: 1440px)`           |

### CSS Breakpoints (copy-paste ready)

```css
/* Mobile Small — default base styles, no media query needed */

/* Mobile */
@media (min-width: 480px) { }

/* Tablet */
@media (min-width: 768px) { }

/* Laptop */
@media (min-width: 1024px) { }

/* Desktop */
@media (min-width: 1280px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

### Tailwind Prefix Map

| Tailwind Prefix | Fires At  | Device            |
|-----------------|-----------|-------------------|
| (no prefix)     | 320px+    | Mobile Small      |
| `sm:`           | 480px+    | Mobile            |
| `md:`           | 768px+    | Tablet            |
| `lg:`           | 1024px+   | Laptop            |
| `xl:`           | 1280px+   | Desktop           |
| `2xl:`          | 1440px+   | Large Desktop     |

---

## 2. Typography — Pixel Sizes Per Device

Font sizes must scale down on smaller screens. Never use a font below **12px** on any device.

| Element        | Mobile Small | Mobile | Tablet | Laptop | Desktop | Font Weight |
|----------------|-------------|--------|--------|--------|---------|-------------|
| Page Title     | 22px        | 24px   | 28px   | 30px   | 32px    | 800         |
| Section Title  | 18px        | 20px   | 22px   | 24px   | 24px    | 700         |
| Card Title     | 16px        | 18px   | 18px   | 20px   | 20px    | 700         |
| Body Text      | 14px        | 14px   | 15px   | 16px   | 16px    | 400         |
| Small Text     | 12px        | 12px   | 13px   | 14px   | 14px    | 400         |
| Table Text     | 12px        | 12px   | 13px   | 14px   | 14px    | 500         |
| Button Text    | 14px        | 14px   | 14px   | 14px   | 14px    | 700         |
| Input Text     | 16px        | 16px   | 16px   | 16px   | 16px    | 400         |
| Caption        | 11px        | 11px   | 12px   | 12px   | 12px    | 400         |
| Label          | 12px        | 12px   | 13px   | 13px   | 13px    | 600         |
| Nav Item       | 13px        | 13px   | 14px   | 14px   | 14px    | 700         |

> **Rule:** Input text must always stay at 16px on mobile to prevent iOS from auto-zooming the page when an input is focused.

---

## 3. Spacing — Pixel Values Per Device

| Token       | Mobile Small | Mobile | Tablet | Laptop | Desktop |
|-------------|-------------|--------|--------|--------|---------|
| Extra Small | 4px         | 4px    | 4px    | 4px    | 4px     |
| Small       | 8px         | 8px    | 8px    | 8px    | 8px     |
| Medium      | 12px        | 16px   | 16px   | 16px   | 16px    |
| Large       | 16px        | 20px   | 24px   | 24px   | 24px    |
| Extra Large | 24px        | 28px   | 32px   | 32px   | 32px    |
| Section Gap | 32px        | 40px   | 48px   | 48px   | 48px    |
| Page Padding| 12px        | 16px   | 20px   | 24px   | 24px    |

---

## 4. Container & Layout Widths

| Device        | Container Max Width | Horizontal Padding | Layout Type          |
|---------------|---------------------|--------------------|----------------------|
| Mobile Small  | 100%                | 12px each side     | Single column        |
| Mobile        | 100%                | 16px each side     | Single column        |
| Tablet        | 100%                | 20px each side     | 1–2 columns          |
| Laptop        | 100%                | 24px each side     | Sidebar + content    |
| Desktop       | 1280px              | 24px each side     | Sidebar + content    |
| Large Desktop | 1440px              | 32px each side     | Sidebar + wide content|

```css
.container {
  width: 100%;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 12px;
  padding-right: 12px;
}

@media (min-width: 480px) {
  .container { padding-left: 16px; padding-right: 16px; }
}

@media (min-width: 768px) {
  .container { padding-left: 20px; padding-right: 20px; }
}

@media (min-width: 1024px) {
  .container { padding-left: 24px; padding-right: 24px; }
}

@media (min-width: 1440px) {
  .container { padding-left: 32px; padding-right: 32px; }
}
```

---

## 5. Navbar — Height & Behavior Per Device

| Device       | Height | Search Bar | Extra Items       | Behavior          |
|--------------|--------|------------|-------------------|-------------------|
| Mobile Small | 56px   | Hidden     | Hidden            | Hamburger only    |
| Mobile       | 56px   | Hidden     | Hidden            | Hamburger + logo  |
| Tablet       | 60px   | 200px wide | Notification icon | Hamburger visible |
| Laptop       | 64px   | 300px wide | All icons visible | Full navbar       |
| Desktop      | 64px   | 380px wide | All icons visible | Full navbar       |

```css
.navbar { height: 56px; }

@media (min-width: 768px) { .navbar { height: 60px; } }

@media (min-width: 1024px) { .navbar { height: 64px; } }
```

**Functional rules — all devices:**
- Navbar must be `position: sticky; top: 0` — always visible on scroll
- `z-index: 100` minimum so it sits above all page content
- Hamburger button must be exactly `44px × 44px` tappable area (touch rule)
- Logo must always be visible on every device

---

## 6. Sidebar — Width & Behavior Per Device

| Device       | Sidebar Width | Behavior                              | Trigger to Open      |
|--------------|--------------|---------------------------------------|----------------------|
| Mobile Small | 100% (full)  | Hidden — slides in as full drawer     | Hamburger button tap |
| Mobile       | 280px        | Hidden — slides in from left as drawer| Hamburger button tap |
| Tablet       | 220px        | Collapsible — icon-only when collapsed| Hamburger button tap |
| Laptop       | 240px        | Collapsible — icon-only when collapsed| Hamburger button tap |
| Desktop      | 260px        | Always visible, persistent            | Not collapsible      |
| Large Desktop| 280px        | Always visible, persistent            | Not collapsible      |

```css
/* Mobile: sidebar is a drawer */
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 200;
}
.sidebar.open { transform: translateX(0); }

/* Desktop: sidebar always visible */
@media (min-width: 1280px) {
  .sidebar {
    position: relative;
    transform: none;
    width: 260px;
  }
}
```

**Functional rules:**
- On mobile/tablet: clicking outside the drawer (overlay area) must close it
- On mobile/tablet: pressing ESC key must close the drawer
- Sidebar scroll must be independent from the main content scroll
- Active menu item must be visually distinct (not color-only — use bold + indicator)
- Each nav item must have a minimum height of **44px** for touch

---

## 7. Button — Size & Touch Rules Per Device

Minimum button height on ALL devices is **44px** — this is the touch target requirement for mobile and tablet.

| Button Size | Height | Min Width | Horizontal Padding | Font Size |
|-------------|--------|-----------|-------------------|-----------|
| Small       | 36px   | 80px      | 12px              | 12px      |
| Medium      | 44px   | 100px     | 20px              | 14px      |
| Large       | 52px   | 120px     | 28px              | 16px      |

| Device       | Button Width Behavior               | Preferred Size |
|--------------|-------------------------------------|----------------|
| Mobile Small | Full width (`width: 100%`)          | Large (52px)   |
| Mobile       | Full width or minimum 44px height   | Medium (44px)  |
| Tablet       | Auto width, minimum 44px height     | Medium (44px)  |
| Laptop       | Auto width                          | Medium (44px)  |
| Desktop      | Auto width                          | Medium (44px)  |

```css
/* All buttons — minimum touch target */
button, [role="button"] {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
}

/* Mobile: full width primary buttons */
@media (max-width: 480px) {
  .btn-primary { width: 100%; }
}
```

**Functional rules — touch devices:**
- Never use hover as the only visual feedback — add active/pressed state (`transform: scale(0.98)`)
- Disabled buttons must have `cursor: not-allowed` and reduced opacity (`opacity: 0.5`)
- Loading buttons must show a spinner and be `pointer-events: none` while loading
- Buttons inside forms must not require double-tap on iOS

---

## 8. Input & Form — Size Per Device

| Element         | Height | Horizontal Padding | Font Size | Width    |
|-----------------|--------|--------------------|-----------|----------|
| Standard Input  | 44px   | 14px               | 16px      | 100%     |
| Small Input     | 36px   | 10px               | 14px      | 100%     |
| Textarea        | 96px+  | 14px               | 16px      | 100%     |
| Select Dropdown | 44px   | 14px               | 16px      | 100%     |
| Checkbox        | 20px   | —                  | —         | 20px     |
| Radio Button    | 20px   | —                  | —         | 20px     |
| Toggle Switch   | 24px   | —                  | —         | 44px     |

### Form Grid Layout Per Device

| Device       | Form Columns       | Gap   |
|--------------|--------------------|-------|
| Mobile Small | 1 column           | 12px  |
| Mobile       | 1 column           | 16px  |
| Tablet       | 1–2 columns        | 16px  |
| Laptop       | 2 columns          | 16px  |
| Desktop      | 2–3 columns        | 20px  |

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 480px) { .form-grid { gap: 16px; } }

@media (min-width: 768px) {
  .form-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

@media (min-width: 1280px) {
  .form-grid { gap: 20px; }
}
```

**Functional rules — touch devices:**
- Input height must be minimum **44px** — required for touch accuracy
- Font size must be **16px** on mobile to stop iOS from zooming the page
- Checkboxes and radios must have a tap area of at least **44px × 44px** even if the visual is smaller (use padding)
- Toggle switches must be at least **44px wide** and respond to tap, not just drag
- Form fields must show visible focus state (outline or border change) — not color-only

---

## 9. Card — Padding & Grid Per Device

| Device       | Card Padding | Border Radius | Grid Columns       | Gap   |
|--------------|-------------|---------------|--------------------|-------|
| Mobile Small | 14px        | 12px          | 1 column           | 12px  |
| Mobile       | 16px        | 14px          | 1 column           | 14px  |
| Tablet       | 18px        | 16px          | 2 columns          | 16px  |
| Laptop       | 20px        | 16px          | 2–3 columns        | 20px  |
| Desktop      | 20px        | 16px          | 3–4 columns        | 20px  |
| Large Desktop| 24px        | 16px          | 4 columns          | 24px  |

```css
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 480px) { .card-grid { gap: 14px; } }

@media (min-width: 768px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}

@media (min-width: 1280px) {
  .card-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 10. Table — Behavior Per Device

| Device       | Table Display        | Header           | Row Height | Font Size |
|--------------|----------------------|------------------|------------|-----------|
| Mobile Small | Horizontal scroll    | Sticky           | 48px       | 12px      |
| Mobile       | Horizontal scroll    | Sticky           | 48px       | 12px      |
| Tablet       | Horizontal scroll    | Sticky           | 44px       | 13px      |
| Laptop       | Full display         | Sticky           | 44px       | 14px      |
| Desktop      | Full display         | Sticky           | 44px       | 14px      |

```css
/* Mobile: table scrolls horizontally, never wraps */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* smooth on iOS */
}

table {
  width: 100%;
  min-width: 500px; /* forces scroll on narrow screens */
  border-collapse: collapse;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}

tbody tr { min-height: 44px; }

@media (min-width: 1024px) {
  table { min-width: unset; }
}
```

**Functional rules:**
- Table rows must be tappable on touch devices (full row tap, not just text)
- Row tap area must be minimum **44px tall**
- Horizontal scroll must be smooth on iOS (`-webkit-overflow-scrolling: touch`)
- Sticky header must remain visible when scrolling vertically

---

## 11. Modal — Width Per Device

| Device       | Modal Width | Max Height | Position            | Close Methods              |
|--------------|-------------|------------|---------------------|----------------------------|
| Mobile Small | 95%         | 90vh       | Bottom sheet or center| Tap outside, ESC, X button |
| Mobile       | 95%         | 90vh       | Bottom sheet or center| Tap outside, ESC, X button |
| Tablet       | 90%         | 85vh       | Center              | Tap outside, ESC, X button |
| Laptop       | 600px       | 80vh       | Center              | Tap outside, ESC, X button |
| Desktop      | 600px       | 80vh       | Center              | Tap outside, ESC, X button |
| Large Desktop| 700px       | 80vh       | Center              | Tap outside, ESC, X button |

```css
.modal {
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .modal { width: 90%; max-height: 85vh; }
}

@media (min-width: 1024px) {
  .modal { width: 600px; max-height: 80vh; }
}

@media (min-width: 1440px) {
  .modal { width: 700px; }
}
```

**Functional rules:**
- Modal body must be independently scrollable if content overflows
- Background overlay must block interaction with content behind it
- On mobile, consider bottom sheet style (slides up from bottom) for better UX
- Close button (X) must be minimum **44px × 44px** tappable area
- ESC key must close the modal on all devices (keyboard users)
- Focus must be trapped inside modal while it is open

---

## 12. Grid Columns Per Device

This table applies to all grid-based layouts: KPI cards, dashboards, product lists, etc.

| Content Type         | Mobile Small | Mobile | Tablet | Laptop | Desktop |
|----------------------|-------------|--------|--------|--------|---------|
| KPI / Stat Cards     | 1           | 2      | 2      | 4      | 4       |
| Dashboard Panels     | 1           | 1      | 2      | 3      | 3       |
| Product / Item Cards | 1           | 1      | 2      | 3      | 4       |
| Form Fields          | 1           | 1      | 2      | 2      | 3       |
| Image Gallery        | 1           | 2      | 3      | 4      | 4       |
| Achievement Badges   | 2           | 2      | 3      | 4      | 4       |

```css
/* Universal responsive grid */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 480px) {
  .grid-2-up { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}

@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}

@media (min-width: 1280px) {
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 13. Touch Screen — Functional Rules

These rules apply to **any device with a touch screen**: mobile phones, tablets, touch laptops, and Android/iOS devices.

### Core Touch Rules

| Rule                          | Requirement                                              |
|-------------------------------|----------------------------------------------------------|
| Minimum touch target size     | 44px × 44px for every tappable element                  |
| Touch target spacing          | Minimum 8px gap between adjacent touch targets           |
| Tap feedback                  | Every tap must have visible feedback within 100ms        |
| No hover-only interactions    | Hover states are invisible on touch — add tap/active state|
| No double-tap requirement     | Actions must fire on single tap                          |
| No long-press requirement     | Never require long-press for primary actions             |
| Drag and swipe                | Must have visible handle or clear affordance             |
| Scroll areas                  | Must use `-webkit-overflow-scrolling: touch` on iOS      |

### Tap Feedback Implementation

```css
/* Active state for all tappable elements */
button:active,
a:active,
[role="button"]:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.1s ease, opacity 0.1s ease;
}

/* Remove 300ms click delay on mobile */
* { touch-action: manipulation; }
```

---

## 14. Touch Targets — All Interactive Elements

Every interactive element must meet the 44px minimum on touch devices. If the visual is smaller, increase the tappable area using padding.

| Element            | Visual Size | Minimum Tap Area | Method                        |
|--------------------|-------------|------------------|-------------------------------|
| Button (primary)   | 44px tall   | 44px × 44px      | Height already 44px           |
| Icon button        | 20px icon   | 44px × 44px      | Add `padding: 12px`           |
| Checkbox           | 18px × 18px | 44px × 44px      | Wrap in 44px label            |
| Radio button       | 18px × 18px | 44px × 44px      | Wrap in 44px label            |
| Toggle switch      | 24px × 44px | 44px × 44px      | Already wide enough           |
| Nav item (sidebar) | Any height  | min-height: 44px | Set `min-height: 44px`        |
| Nav item (bottom)  | Any height  | min-height: 56px | Taller for thumb reach        |
| Table row          | 44px+       | 44px × full width| Set `min-height: 44px` on tr  |
| Dropdown option    | 36px+       | 44px × full width| Set `min-height: 44px`        |
| Close (X) button   | 16px icon   | 44px × 44px      | Add `padding: 14px`           |
| Accordion header   | Any         | min-height: 44px | Set `min-height: 44px`        |
| Tab item           | Any         | min-height: 44px | Set `min-height: 44px`        |
| Link in text       | Text height | Pad vertically   | Add `padding: 8px 0`          |

```css
/* Universal touch area fix for icon buttons */
.icon-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Expand checkbox tap area */
.checkbox-label {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
```

---

## 15. Navigation — Touch Behavior Per Device

| Feature              | Mobile              | Tablet               | Laptop / Desktop    |
|----------------------|---------------------|----------------------|---------------------|
| Primary nav          | Bottom bar          | Sidebar drawer       | Persistent sidebar  |
| Sidebar trigger      | Hamburger (44px)    | Hamburger (44px)     | Always visible      |
| Drawer open gesture  | Tap hamburger       | Tap hamburger        | Not applicable      |
| Drawer close gesture | Tap overlay         | Tap overlay / ESC    | Not applicable      |
| Swipe to open drawer | Swipe right edge    | Optional             | Not applicable      |
| Swipe to close drawer| Swipe left          | Optional             | Not applicable      |
| Nav item tap area    | min 56px tall       | min 44px tall        | min 44px tall       |
| Active state         | Bold + icon change  | Bold + indicator bar | Bold + indicator bar|

### Bottom Navigation Bar (Mobile Only)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  z-index: 100;

  /* iOS safe area */
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  cursor: pointer;
  gap: 3px;
}

.bottom-nav-item span {
  font-size: 10px;
  font-weight: 700;
}
```

---

## 16. Gestures & Interactions Per Device

| Gesture / Interaction   | Mobile       | Tablet       | Laptop       | Desktop      |
|-------------------------|-------------|-------------|-------------|-------------|
| Tap (primary action)    | Yes          | Yes          | Click        | Click        |
| Swipe left/right        | Yes (cards, drawers) | Yes   | Scroll       | Scroll       |
| Swipe down to refresh   | Supported    | Supported    | Not applicable| Not applicable|
| Pull to close modal     | Supported    | Optional     | ESC / click  | ESC / click  |
| Pinch to zoom           | Supported (images)| Supported| Ctrl+scroll  | Ctrl+scroll  |
| Long press              | Avoid for primary actions | Avoid | Right-click | Right-click |
| Hover state             | Not visible  | Not visible  | Visible      | Visible      |
| Drag to reorder         | Must have drag handle | Must have handle | Drag works | Drag works |
| Double tap              | Never required | Never required | Works | Works     |

---

## 17. Scroll Behavior Per Device

| Rule                          | Mobile            | Tablet            | Laptop / Desktop  |
|-------------------------------|-------------------|-------------------|-------------------|
| Vertical page scroll          | Native (smooth)   | Native (smooth)   | Native            |
| Horizontal scroll (tables)    | Touch scroll      | Touch scroll      | Scrollbar visible |
| Momentum scrolling            | Required (iOS)    | Required (iOS)    | Native            |
| Sticky navbar                 | Yes               | Yes               | Yes               |
| Sticky table header           | Yes               | Yes               | Yes               |
| Scroll to top button          | Show after 300px  | Show after 300px  | Show after 300px  |
| Infinite scroll trigger       | 200px from bottom | 200px from bottom | 300px from bottom |
| Sidebar scroll (independent)  | Yes (own scroll)  | Yes (own scroll)  | Yes (own scroll)  |

```css
/* Smooth momentum scroll for iOS touch */
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Horizontal scroll for tables on mobile */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

---

## 18. Keyboard & Input Behavior Per Device

| Rule                             | Mobile / Tablet              | Laptop / Desktop       |
|----------------------------------|------------------------------|------------------------|
| Input font size                  | 16px (prevents iOS zoom)     | 14–16px                |
| Virtual keyboard appearance      | Pushes content up            | Not applicable         |
| Page reflow on keyboard open     | Content must not break       | Not applicable         |
| Input type for numbers           | `type="number"` or `inputmode="numeric"` | `type="number"` |
| Input type for email             | `type="email"` (shows @ key) | `type="email"`         |
| Input type for phone             | `type="tel"`                 | `type="tel"`           |
| Input type for search            | `type="search"` (shows Go)   | `type="search"`        |
| Autocomplete                     | Use `autocomplete` attribute | Use `autocomplete`     |
| Tab key navigation               | Available                    | Required to work fully |
| Enter key submits form           | Yes                          | Yes                    |
| ESC key closes modal / dropdown  | Yes                          | Yes                    |

```html
<!-- Correct input types for touch keyboards -->
<input type="email"  inputmode="email"   autocomplete="email" />
<input type="tel"    inputmode="tel"     autocomplete="tel" />
<input type="number" inputmode="numeric" />
<input type="search" inputmode="search"  />
<input type="text"   inputmode="text"    autocomplete="name" />
```

---

## 19. Device-Specific Functional Rules

### Mobile (320px – 767px)

- Layout: single column only — never multi-column
- Navigation: bottom bar (max 5 items) + hamburger drawer
- Sidebar: hidden by default, drawer on tap, full-screen or 280px
- Tables: horizontal scroll only — never wrap or hide columns
- Modals: 95% width, consider bottom sheet (slides up)
- Buttons: full width for primary actions
- Touch targets: minimum 44px height, 56px for bottom nav items
- No hover states — use `:active` instead
- Font minimum: 12px (never below)
- Input font: always 16px to prevent zoom
- iOS safe areas: apply `env(safe-area-inset-*)` for notch/home bar
- No fixed widths on any element — use `%` or `vw`

### Tablet (768px – 1023px)

- Layout: 2 columns max for cards; 1 column for forms
- Navigation: collapsible sidebar (220px) or hamburger drawer
- Sidebar: shows on tap, icon-only when collapsed (60px wide)
- Tables: horizontal scroll if more than 4 columns
- Modals: 90% width, centered
- Buttons: auto width, minimum 44px height
- Touch targets: minimum 44px on all elements
- Hover states: available on external keyboards, but active states still needed
- Sidebar collapse: icon-only at 60px wide when collapsed

### Laptop (1024px – 1279px)

- Layout: 2–3 columns for cards; 2 columns for forms
- Navigation: sidebar always visible at 240px, collapsible to 60px
- Sidebar: persistent, collapse/expand button available
- Tables: full display, sticky header
- Modals: fixed 600px width, centered
- Buttons: auto width
- Hover states: fully active
- Touch: may have touch screen — keep 44px targets

### Desktop (1280px and above)

- Layout: 3–4 columns for cards; 2–3 for forms
- Navigation: sidebar always visible at 260–280px, not collapsible
- Tables: full display, all columns visible, sticky header
- Modals: 600–700px width centered
- Container: max-width 1440px, centered with auto margins
- Hover states: fully active
- Keyboard navigation: full support (tab, enter, escape, arrow keys)

---

## 20. Functional Checklist Per Device

Run this checklist before shipping any page or component.

### Mobile Checklist
- [ ] Layout is single column
- [ ] No horizontal scrollbar on the page itself
- [ ] All buttons are minimum 44px tall
- [ ] All inputs are minimum 44px tall and font-size 16px
- [ ] Sidebar is hidden and opens as a drawer on tap
- [ ] Drawer closes when tapping the overlay
- [ ] Bottom navigation bar is visible (if used)
- [ ] Tables scroll horizontally
- [ ] Modals are 95% width and scrollable inside
- [ ] Modal closes on tap outside and ESC
- [ ] No hover-only states — active/tap states exist
- [ ] iOS safe area padding applied
- [ ] Page does not zoom when input is focused
- [ ] Touch momentum scroll works in scrollable areas
- [ ] All icons have minimum 44px tap area

### Tablet Checklist
- [ ] Layout is 2-column max
- [ ] Sidebar collapses to icon-only (60px) or drawer
- [ ] All touch targets are minimum 44px
- [ ] Tables scroll horizontally if needed
- [ ] Modals are 90% width
- [ ] Drawer overlay closes on tap
- [ ] Both touch and mouse interactions work

### Laptop Checklist
- [ ] Sidebar is visible (240px) and collapsible
- [ ] Layout uses 2–3 columns
- [ ] Hover states are visible
- [ ] All keyboard navigation works (tab, enter, ESC)
- [ ] Tables show full columns with sticky header
- [ ] Modals are fixed 600px centered
- [ ] Focus rings are visible on all interactive elements

### Desktop Checklist
- [ ] Container is max-width 1440px and centered
- [ ] Sidebar is always visible at 260–280px
- [ ] Layout uses 3–4 columns for cards
- [ ] All hover states work correctly
- [ ] Full keyboard navigation works
- [ ] Tables display all columns
- [ ] No layout overflow or unexpected scroll
- [ ] Focus is visible on all interactive elements
- [ ] Modals are 600–700px wide and centered

---

*This file contains device breakpoints, pixel sizes, touch rules, and functional interaction specs only.*
*No colors, themes, or visual design tokens are included in this document.*
