---
name: Modern Command Center
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  unit: 4px
---

## Brand & Style

The design system is a high-performance, enterprise-grade framework tailored for logistics and operational excellence. It evokes an emotional response of absolute control, precision, and intelligence. The aesthetic is a fusion of **Corporate Modern** and **Glassmorphism**, taking inspiration from industry leaders like Linear and Vercel to create a "command center" atmosphere.

### Design Principles
- **Total Clarity:** Information density is high but never cluttered, utilizing purposeful whitespace to separate critical data.
- **Subtle Depth:** Surfaces use translucent layers and backdrop blurs to establish hierarchy without physical weight.
- **Technical Precision:** Use of monospaced-adjacent geometric sans-serifs and sharp micro-interactions to reinforce the logistics theme.
- **Sophisticated Dark Mode:** A deep navy-to-charcoal foundation that reduces eye strain during long operational shifts.

## Colors

The color palette is built on a deep, obsidian foundation to ensure high-contrast readability for critical alerts.

- **Foundations:** The primary background is a rich dark navy (`#0B1120`), while surfaces use a slightly lighter slate (`#111827`) to create natural depth.
- **Accents:** The primary blue (`#3B82F6`) signifies action and focus. A secondary violet accent (`#8B5CF6`) is reserved for AI-driven "Copilot" elements and advanced analytics.
- **Status Indicators:** Semantic colors for Success, Warning, and Danger are highly saturated to ensure they pop against the dark background, using subtle glow effects to indicate urgency.

## Typography

Typography is the backbone of the command center aesthetic. 

- **Display & Headlines:** Use **Geist** for its technical, geometric precision. Headlines should feature tighter letter-spacing to appear more impactful and "engineered."
- **Body:** **Inter** provides maximum legibility for dense data tables and long-form operational logs.
- **Data & Labels:** **JetBrains Mono** is utilized for small labels, ID tags (e.g., Trip IDs, License Plates), and numerical data to evoke a developer-tool sensibility.

## Layout & Spacing

The layout follows a **Fluid Grid** system within a 1440px container, utilizing a base unit of 4px for all spacing decisions.

- **Desktop (1280px+):** 12-column grid with 24px gutters. The sidebar is fixed at 260px.
- **Tablet (768px - 1279px):** 8-column grid with 20px gutters. Sidebar collapses into an icon-only rail or a hidden drawer.
- **Mobile (Up to 767px):** 4-column grid with 16px gutters and margins.
- **Rhythm:** Use large internal padding (24px - 32px) for cards to maintain the "premium" feel of the interface, preventing data from feeling cramped.

## Elevation & Depth

Depth is established through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Surface 0 (Background):** `#0B1120` - The infinite base layer.
- **Surface 1 (Cards/Sidebar):** `#111827` with a 1px border of `white/10%`.
- **Surface 2 (Modals/Popovers):** Semi-transparent background with a `20px` backdrop blur and a `white/15%` top-edge highlight (inner stroke) to simulate light catching glass.
- **Shadows:** Use extremely diffused, large-radius shadows (`0 20px 40px rgba(0,0,0,0.4)`) for floating elements like the AI Copilot to separate them from the main dashboard plane.

## Shapes

The shape language is consistently "Rounded" to soften the technical nature of the data.

- **Primary Elements:** Containers, cards, and input fields use a **16px** (rounded-lg) radius.
- **Inner Elements:** Buttons and nested chips use an **8px** (rounded-md) radius to create a harmonious "nested" appearance.
- **AI Elements:** Elements associated with the AI Copilot use "Pill-shaped" geometry to distinguish them as more "organic" and assistive.

## Components

### Buttons
- **Primary:** Solid `#3B82F6` with a subtle top-to-bottom gradient. Text is bold white.
- **Secondary:** Ghost style with a `white/10%` border and a blur background. 

### KPI Cards
- Feature a subtle 1px border. 
- Include a 5% opacity background gradient using the primary or accent color to provide a "micro-glow" effect.
- Metrics are displayed in Geist Bold.

### Data Tables
- Minimalist design with no vertical dividers.
- Rows feature a `white/5%` hover state.
- Header labels use **JetBrains Mono** in all-caps for a technical, tabular feel.

### AI Copilot (Floating)
- Floating button or panel with a **Glassmorphic** finish.
- Uses the Accent color (`#8B5CF6`) for its glow effect to indicate intelligence.

### Sidebar
- High-contrast typography for active states with a vertical "indicator bar" on the left using the primary color.
- Icons are 20px, light-weight strokes.