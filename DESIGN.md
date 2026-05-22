# Design System Specification: The Balanced Chronograph

## 1. Overview & Creative North Star
This design system is built to transform a utilitarian utility—time-tracking—into a high-end editorial experience. We are moving away from the "data-entry" aesthetic of legacy enterprise tools toward a philosophy we call **"The Balanced Chronograph."**

**The Creative North Star: The Balanced Chronograph**
Time tracking is often stressful; this system aims to provide a sense of architectural calm. We achieve this through:
*   **Intentional Asymmetry:** Breaking the rigid grid to guide the eye toward the most important metric (e.g., the current "Balance").
*   **Tonal Depth:** Replacing harsh lines with sophisticated "surface stacking."
*   **Editorial Authority:** Using high-contrast typography scales (Manrope vs. Inter) to make data feel like a curated report rather than a spreadsheet.

By prioritizing white space and "breathing room," we ensure the user feels in control of their time, not chased by it.

---

## 2. Colors & Surface Logic
The palette is rooted in a deep, trustworthy teal (`primary: #004d64`) paired with a sophisticated neutral foundation. 

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. 
Structure must be defined through:
1.  **Background Shifts:** Use `surface-container-low` for large section backgrounds against a `surface` base.
2.  **Tonal Nesting:** An element’s importance is defined by its "altitude." Place a `surface-container-lowest` card on top of a `surface-container-high` section to create natural separation.

### Signature Textures & Soul
While the base remains flat to ensure accessibility, main CTAs (like "Start Timer") should utilize a **Solid-Tonal Transition**. Use `primary` as the base and `primary-container` for internal elements to provide a professional polish that feels more "custom" than a standard flat hex code.

### Glassmorphism
For floating elements (e.g., a "Current Session" bar at the bottom of the screen), use `surface_container_lowest` at 85% opacity with a `20px` backdrop blur. This ensures the UI feels integrated and modern, allowing the colors of the underlying list to bleed through softly.

---

## 3. Typography
We use a dual-typeface system to balance character with readability.

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels architectural and modern. Use `display-lg` (3.5rem) for balance totals to give them "Editorial Weight."
*   **Body & Labels (Inter):** The industry standard for legibility. Use `body-md` (0.875rem) for time entries and secondary data to ensure the eye never tires during long-form reviews.

**Hierarchy Tip:** Always pair a `headline-sm` with a `label-md` in all-caps (tracking +5%) to create a "Caption & Title" look common in high-end magazines.

---

## 4. Elevation & Depth
In this design system, we do not "drop shadows"; we "layer light."

*   **Tonal Layering Principle:** Depth is achieved by stacking. 
    *   **Level 0 (Base):** `surface` (`#f7f9fb`)
    *   **Level 1 (Sections):** `surface-container-low` (`#f2f4f6`)
    *   **Level 2 (Cards):** `surface-container-lowest` (`#ffffff`)
*   **Ambient Shadows:** If a card must float, use a shadow with a 24px blur and 4% opacity. The shadow color must be a tinted version of `on-surface` (`#191c1e`), never pure black.
*   **The Ghost Border:** If a boundary is required for accessibility (e.g., input fields), use the `outline-variant` token at **15% opacity**. This provides a hint of structure without interrupting the visual flow.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (`#004d64`) with `on_primary` text. Use `rounded-md` (0.375rem).
*   **Secondary:** `secondary_container` background with `on_secondary_container` text.
*   **Tertiary:** Ghost style. Text only in `primary` color, no background unless hovered/pressed.

### Cards & Lists
*   **The Divider Ban:** Never use lines to separate time entries. Use `16px` of vertical white space or a subtle shift from `surface-container-low` to `surface-container-highest` for the active entry.
*   **Layout:** Use asymmetrical padding (e.g., more padding on the left than the right) to create an "Editorial Margin" where timestamps can sit independently from the task description.

### Input Fields
*   **Style:** Minimalist. No background fill. Use a "Ghost Border" bottom-line only or a very subtle `surface-container-high` rounded box.
*   **Focus State:** Transition the bottom border to `primary` with a 2px thickness.

### Time-Specific Components
*   **Chronograph Chips:** Use `secondary_fixed` for "Clocked In" status and `tertiary_fixed` for "Overtime" or "Balance Warning." These soft, tinted backgrounds provide high-end signaling without the "stoplight" aggression of standard red/green.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `display-lg` for the "Remaining Balance" to make it the hero of the dashboard.
*   **Do** use `surface-tint` sparingly to highlight active states in navigation.
*   **Do** leverage `surface-bright` for the most important interactive cards to make them "pop" against the neutral background.

### Don’t:
*   **Don’t** use 1px solid black or grey borders. This immediately makes the app look like a generic template.
*   **Don’t** use standard "Drop Shadows." If the element doesn't feel like it's naturally lifting via color, re-evaluate the layout.
*   **Don’t** crowd the interface. If you can't fit it with `1.5rem` of padding, it likely belongs on a secondary screen.

---

## 7. Interaction Note
Every interaction should feel dampened and deliberate. When a user taps a time log, the transition should be a soft fade-in or a subtle "lift" using a Tonal Layering shift, rather than a jarring slide animation. This reinforces the "Balanced Chronograph" philosophy of calm and precision.