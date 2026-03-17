# Inner Page Navbar Spec

## Which pages
Specialties, Cases, Scorecard — NOT the landing page (/)

## Position
Fixed, top: 24px, left: 24px — pinned top left, never moves

## Collapsed state (default)
- Width: 138px
- Shows: wordmark "Casuist" + chevron › only
- Chevron points right (›)

## Expanded state (on hover)
- Width: 500px, expands rightward
- Shows: wordmark + chevron + all links + CTA
- Chevron rotates 180deg to point left (‹)
- Links fade in: opacity 0.2s ease 0.18s delay

## On page load
- Briefly show full expanded pill (800ms)
- Then animate collapse to 138px
- Purpose: teaches user the pill is interactive

## On scroll
- Pill stays fixed at top left always
- No hide/show behaviour — always visible

## Layout when expanded (left to right)
Casuist · › · [Cases] [Leaderboard 🔒] [How It Works] [Get started]

## Link states
- Cases: active (white, slight white bg)
- Leaderboard: locked — gray (rgba(255,255,255,0.3)), 
  not clickable, show 🔒 icon
- How It Works: normal
- Get started: white pill button, dark blue text

## Transitions
- Width: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
- Chevron rotate: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
- Links opacity: 0.2s ease 0.18s delay

## Styles — copy exactly from landing page navbar
- background: rgba(46, 134, 193, 0.92)
- backdrop-filter: blur(20px)
- border: 1px solid rgba(255, 255, 255, 0.3)
- border-radius: 100px
- box-shadow: inset 0 1px 0 rgba(255,255,255,0.3),
              0 8px 32px rgba(46,134,193,0.35),
              0 2px 8px rgba(46,134,193,0.2)

## Do NOT touch
- Landing page navbar
- Any page content or layout
- Colors, fonts, or shadows
```

Then your Claude Code prompt is just:
```
Read INNER_NAVBAR_SPEC.md then implement the 
inner page navbar exactly as specified. 
Check the landing page navbar for style 
reference — copy its CSS values exactly.