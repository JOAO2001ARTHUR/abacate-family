---
name: Abacate Financial Intelligence
colors:
  surface: '#f7fbf0'
  surface-dim: '#d8dbd1'
  surface-bright: '#f7fbf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5ea'
  surface-container: '#ecefe5'
  surface-container-high: '#e6eadf'
  surface-container-highest: '#e0e4d9'
  on-surface: '#191d16'
  on-surface-variant: '#41493d'
  inverse-surface: '#2d322b'
  inverse-on-surface: '#eff2e7'
  outline: '#717a6b'
  outline-variant: '#c0c9b9'
  surface-tint: '#296c1f'
  primary: '#1f6216'
  on-primary: '#ffffff'
  primary-container: '#397c2d'
  on-primary-container: '#cdffbb'
  inverse-primary: '#90d87d'
  secondary: '#2d6b22'
  on-secondary: '#ffffff'
  secondary-container: '#acf198'
  on-secondary-container: '#327026'
  tertiary: '#90345f'
  on-tertiary: '#ffffff'
  tertiary-container: '#ae4c78'
  on-tertiary-container: '#ffedf1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#abf596'
  primary-fixed-dim: '#90d87d'
  on-primary-fixed: '#002200'
  on-primary-fixed-variant: '#0b5305'
  secondary-fixed: '#aff49a'
  secondary-fixed-dim: '#94d781'
  on-secondary-fixed: '#002200'
  on-secondary-fixed-variant: '#12520b'
  tertiary-fixed: '#ffd9e5'
  tertiary-fixed-dim: '#ffb0ce'
  on-tertiary-fixed: '#3e0022'
  on-tertiary-fixed-variant: '#7d2450'
  background: '#f7fbf0'
  on-background: '#191d16'
  surface-variant: '#e0e4d9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built for a high-performance financial intelligence platform that prioritizes clarity, organic growth, and institutional trust. By moving away from traditional "bank blue" and adopting the "Abacate Family" palette, the system signals a fresh, modern approach to wealth management—one that feels alive and regenerative rather than cold and static.

The aesthetic follows a **Minimalist / Corporate Modern** hybrid. It utilizes heavy whitespace and precise alignment to manage complex data density, while the monochromatic green scale provides a cohesive, calming environment for high-stakes decision-making. The visual language is utilitarian and systematic, ensuring that users can process large volumes of financial data without cognitive fatigue.

## Colors

The "Abacate Family" palette replaces all previous blue-based interfaces. The color logic is hierarchical:

*   **Primary (#397c2d):** Used for primary actions, active navigation states, and high-level brand identifiers.
*   **Secondary (#95d982):** Applied to supporting interactive elements, progress bars, and subtle highlights.
*   **Accent/Tint (#f2ffd9):** Used as a background surface for dashboards, table headers, and containers to create soft separation from the pure white background.
*   **Neutrals:** A custom scale of warm grays with a hint of olive to ensure they harmonize with the green primary tones.
*   **Semantics:** Red and Amber are reserved strictly for late payments, market drops, or pending approvals, ensuring they pop against the otherwise green-dominated environment.

## Typography

The typography system relies exclusively on **Inter**, chosen for its exceptional legibility in data-dense financial applications. 

To handle complex numerical data, the system utilizes "Tabular Numbers" (tnum) for all tables and financial figures, ensuring that decimals align perfectly for quick scanning. Headlines are tight and bold to provide strong structural anchors, while body text uses a generous line height to maintain readability across long financial reports.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop dashboards and a **Fluid Grid** for mobile views. The layout is built on a strict 4px baseline grid to maintain alignment across text and components.

Dashboards are structured on a 12-column grid with 16px gutters. Elements are grouped using "spacing stacks" to create clear vertical hierarchy. Data tables should occupy the full width of their containers, utilizing the secondary/accent tint (#f2ffd9) to distinguish between rows or column headers.

## Elevation & Depth

Depth is established through **Tonal Layers** rather than heavy shadows. This keeps the interface feeling light and efficient.

*   **Level 0 (Canvas):** Pure white (#FFFFFF) or the Pale Green tint (#f2ffd9) for the main background.
*   **Level 1 (Cards/Modules):** White surfaces with a 1px border in a light green-gray.
*   **Level 2 (Interaction):** Subtle, low-opacity shadows (Color: #397c2d at 8% opacity) are used only when a component is hovered or active.
*   **Modals:** High-contrast borders in Dark Green (#397c2d) with a soft backdrop blur to focus the user’s attention on critical financial inputs.

## Shapes

The shape language is precise and controlled, using a consistent **4px radius** (Soft) for all interactive and container elements. 

This small radius maintains a professional, "software-engineered" look while removing the harshness of sharp 90-degree corners. It applies to buttons, input fields, cards, and even the "pills" used for status indicators. Icons should follow this same logic, avoiding perfectly circular forms in favor of slightly softened corners.

## Components

*   **Buttons:** Primary buttons use a solid #397c2d fill with white text. Secondary buttons use a #f2ffd9 fill with a #397c2d border and text.
*   **Inputs:** Fields use a 1px border. When focused, the border shifts to #397c2d with a 2px outer glow in the light #95d982.
*   **Data Cards:** Cards utilize a top-border accent of #95d982 to denote "Healthy" assets or the Primary #397c2d for standard containers.
*   **Chips/Badges:** Small, 4px rounded labels. For "Pending," use an Amber background with dark text. For "Late," use a Red background with white text.
*   **Data Visualization:** Graphs and charts must strictly use the green scale (Dark, Light, and Pale) for different data series, ensuring color-blind accessibility by varying the luminosity and adding patterns if necessary.
*   **Navigation:** Vertical sidebars use a white background with a #397c2d "active" indicator bar on the left edge of selected items.