# Navbar Redesign Spec

## Design
Floating pill navbar, fixed at top center of page.
Blue glass style — `rgba(46, 134, 193, 0.92)` background with blur.
White text, white CTA button with dark blue text.
No logo icon. Wordmark only.

## Position
- `position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 50`
- Add enough top padding to page content so it doesn't hide under the pill

## Links (left to right)
1. Wordmark "Casuist" — separated by a right border
2. Cases (nav link)
3. Leaderboard (nav link)
4. How It Works (nav link)
5. "Get started" button (white pill, dark blue text, rightmost)

## CSS
\```css
background: rgba(46, 134, 193, 0.92);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 100px;
padding: 5px 6px 5px 20px;
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.3),
  0 8px 32px rgba(46, 134, 193, 0.35),
  0 2px 8px rgba(46, 134, 193, 0.2);
\```

## Active link style
`color: #fff; background: rgba(255, 255, 255, 0.18); border-radius: 100px;`

## Inactive link style
`color: rgba(255, 255, 255, 0.65);` — brightens to `#fff` on hover
```

**2. Prompt Claude Code:**
```
Read NAVBAR_SPEC.md then update the Navbar component 
to match the spec exactly. Find the existing navbar 
component, replace it completely. Make sure all pages 
have enough top padding so content doesn't sit under 
the fixed navbar.