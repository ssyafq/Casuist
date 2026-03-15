# Casuist — Frontend Design Brief
> Reference document for UI generation. Read this fully before producing any code or designs.

---

## What is Casuist?

Casuist is a clinical case-based learning platform. Think **LeetCode for medical students**. Users pick a medical specialty, get presented with a real patient case from PubMed literature, gather clinical information progressively (like a real doctor would), then rank their differential diagnoses. They get scored and receive AI-powered feedback grounded in real citations.

**The core interaction is progressive reveal** — information is hidden until the user requests it. This is the defining mechanic. The UI must make this feel satisfying and deliberate, like peeling back layers of a mystery.

---

## Aesthetic Direction

**Overall vibe:** Serious, focused, clean. A tool built for people who want to get better at something. Not a cheerful edtech app. Not gamey or cartoonish. Think LeetCode meets a modern SaaS landing page.

**Mode:** Light mode only.

**Reference layouts to study:**
- **Sparrow.ai landing page** — split layout, bold left headline, visual right, minimal nav, single CTA
- **LeetCode problems page** — case list table with difficulty badges, left sidebar, focused reading panel
- **Roohi Koohi CreateMyTest Dribbble shot** — clean card grid, simple white cards, minimal color usage

**What to avoid:**
- Purple gradients on white (generic AI aesthetic)
- Cartoon illustrations or mascots
- Heavy shadows and depth effects
- Too many sections on the landing page
- Dark mode
- Cluttered sidebars

---

## Color Palette

Medical blue family. Use these exact tones:

| Role | Color | Hex |
|------|-------|-----|
| Primary (CTA buttons, accents) | Steel blue | `#2E86C1` |
| Dark accent | Deep navy | `#1A5276` |
| Secondary accent | Teal | `#5DADE2` |
| Light accent | Sky blue | `#AED6F1` |
| Background | Off-white | `#F8FAFC` |
| Surface (cards) | Pure white | `#FFFFFF` |
| Border | Light gray | `#E2E8F0` |
| Text primary | Near black | `#0F172A` |
| Text secondary | Slate | `#64748B` |
| Easy badge | Green | `#16A34A` |
| Medium badge | Amber | `#D97706` |
| Hard badge | Red | `#DC2626` |

---

## Typography

- **Headings:** `DM Sans` or `Outfit` — bold weight, confident
- **Body:** `DM Sans` — clean and readable
- **Monospace accents** (case IDs, PMID citations, scores): `DM Mono` or `JetBrains Mono`

Font sizing:
- Landing headline: 48–56px, font-weight 700
- Section headings: 24–32px, font-weight 600
- Body: 15–16px, font-weight 400
- Labels/badges: 12px, font-weight 600, uppercase + letter-spacing

---

## Pages to Design

### Page 1 — Landing Page

**Layout:** Two-column split (50/50). Clean top nav. Single CTA.

**Left column:**
- Small label above headline: `CLINICAL CASE LEARNING` in uppercase monospace, muted color
- Big bold headline: `"LeetCode for medical students."`
- Subheadline (1-2 lines): `"Work through real PubMed case reports. Build your differential diagnosis skills. Get scored and cited feedback."`
- Two buttons: Primary `"Try a Case"` (filled blue), Secondary `"See How It Works"` (outlined)
- Below buttons: small trust line — `"607 real cases · 5 specialties · AI-grounded feedback"`

**Right column:**
- Rounded card/browser mockup showing a screenshot or clean mockup of the Case View screen
- Subtle drop shadow on the mockup card
- Light blue tinted background behind the mockup

**Nav:** Logo left (`Casuist`), links center (`Cases`, `How It Works`), nothing else. No sign in button for now.

**No footer sections. No feature lists. No testimonials. Just the hero, clean.**

---

### Page 2 — Specialty Selection

**Layout:** Centered, single column. Simple and focused.

**Header:** `"Choose a Specialty"` — large, centered
**Subtext:** `"Pick a specialty to get a case from that domain"`

**Card grid:** 2–3 columns, 5 specialty cards total:
- Cardiology 🫀
- Respiratory 🫁
- Neurology 🧠
- Gastroenterology 🔬
- Endocrinology ⚗️

Each card:
- White background, 1px border, subtle hover shadow + border color shift to `#2E86C1`
- Specialty icon (emoji or simple icon)
- Specialty name in bold
- Small stat below: e.g. `"124 cases"` in muted monospace text
- Clicking the card goes straight into a case — no confirmation modal

---

### Page 3 — Case View (THE MAIN SCREEN)

**This is the most important screen. Spend the most effort here.**

**Layout:** Two-panel split. Fixed height viewport (no long scroll).

**Left panel (60% width) — Case Information Panel:**
- Top: Case metadata bar — `Case #0042 · Cardiology · Medium` with colored difficulty badge
- Chief complaint always visible at top: `"65M presenting with acute chest pain and diaphoresis"`
- Below: revealed sections appear as clean cards stacked vertically
  - Each section has a header label (`HISTORY`, `PHYSICAL EXAM`, `LABS`) in small uppercase monospace
  - Section content in clean readable body text
  - Unrevealed sections shown as locked/dimmed placeholder rows
- Subtle divider between sections
- Small PubMed citation at bottom of panel: `Source: PMID 12345678 · Journal of Cardiology · 2024`

**Right panel (40% width) — Action Panel:**

Phase 1 — Info Gathering:
- Header: `"What would you like to know?"`
- 3 action buttons stacked:
  - `"Request History"` 
  - `"Request Physical Exam"`
  - `"Request Lab Results"`
  - Each button: outlined style, full width, with icon
  - Already-revealed sections show as disabled/checked
- Bottom: `"Ready to Diagnose →"` primary button — only activates after at least 1 section revealed

Phase 2 — Diagnosis Ranking (replaces action buttons after clicking Ready):
- Header: `"Rank your differential diagnoses"`
- Subtext: `"Drag to reorder from most to least likely"`
- 5 draggable diagnosis options as cards
- Each card: numbered position indicator on left, diagnosis name, drag handle icon on right
- Submit button: `"Lock In Diagnosis"` — filled blue, full width

---

### Page 4 — Scorecard

**Layout:** Centered, single column, clean results page.

**Top section:**
- Large score display: `"74 / 100"` — big bold number
- Grade badge: `"B"` in a colored circle
- Subtext: `"Good clinical reasoning. Room to improve on ranking accuracy."`

**Score breakdown cards (horizontal row of 3–4):**
- Diagnosis Accuracy: `40/40`
- Ranking Quality: `18/30`
- Info Efficiency: `16/20`  
- Speed Bonus: `0/10`
- Each as a small card with label, score, and a thin progress bar

**AI Feedback section (opt-in):**
- Collapsed by default
- Toggle button: `"See AI Feedback + Citations"`
- When expanded: paragraph of clinical reasoning feedback
- Citations listed below: `[PMID: 12345678]` in monospace blue links

**Bottom actions:**
- `"Next Case →"` — primary button
- `"Back to Specialties"` — text link

---

## Component Patterns

**Buttons:**
- Primary: filled `#2E86C1`, white text, 6px border-radius, 12px 24px padding
- Secondary: white background, `1px solid #2E86C1`, blue text
- Hover: slight darken + subtle scale(1.01)

**Cards:**
- White background
- `1px solid #E2E8F0` border
- `8px` border-radius
- Hover: border shifts to `#AED6F1`, box-shadow `0 4px 12px rgba(46,134,193,0.1)`

**Badges:**
- Easy: green background `#DCFCE7`, green text `#16A34A`
- Medium: amber background `#FEF3C7`, amber text `#D97706`
- Hard: red background `#FEE2E2`, red text `#DC2626`
- Small, pill-shaped, uppercase, 11px monospace font

**Progress bars:**
- Thin (4px height)
- Background: `#E2E8F0`
- Fill: `#2E86C1`
- Rounded ends

---

## What This App Is NOT

- Not a quiz app with cartoon illustrations
- Not a dark moody medical tool
- Not a dashboard with 10 sidebar nav items
- Not trying to be Duolingo or Quizlet
- No auth screens, no sign in, no profile pages — not needed yet

---

## Technical Notes for Code Generation

- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS only — no custom CSS files
- **Icons:** Lucide React
- **Fonts:** Google Fonts — DM Sans + DM Mono
- **No backend calls in the UI shell** — use hardcoded mock data for all screens
- **Build all 4 pages** as separate routes: `/`, `/specialties`, `/case`, `/scorecard`
- Each page should be a clean standalone component
- Mobile responsive is nice but desktop-first priority