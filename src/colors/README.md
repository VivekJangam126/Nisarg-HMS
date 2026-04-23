# 🎨 Nisarg Color System Documentation

## Overview

The color palette is centralized in `src/colors/` directory with three integrated approaches:

- **palette.ts** - TypeScript constants for programmatic access
- **palette.css** - CSS variables for direct CSS styling  
- **styles.css** - Tailwind configuration (imports palette.css)

---

## Color Palette Breakdown

### 🔵 Blue Family (Structural Backbone)
```
Deep Blue:    #185FA5  → Primary actions, sidebar, main CTAs
Mid Blue:     #378ADD  → Secondary elements, hover states
Light Blue:   #5BA3E8  → Interactive states, light accents
Lighter Blue: #E3EEF8  → Light backgrounds, subtle highlights
```

### 🟢 Teal (Positive/Stable Outcomes)
```
Full Teal:    #1D9E75  → Success indicators, stable status
Pale Teal:    #D8F3E8  → Light backgrounds for teal elements
Dark Teal:    #0F6D54  → Text on teal backgrounds
```

### 🔴 Red (Critical/Urgent)
```
Full Red:     #DC2626  → Critical alerts, urgent indicators
Light Red:    #FEE2E2  → Light backgrounds for red messages
Red Text:     #991B1B  → Dark text on red backgrounds
```

### 🟡 Amber (Caution/Warning)
```
Full Amber:   #D97706  → Pending items, warning alerts
Light Amber:  #FEF3C7  → Light backgrounds for warnings
Amber Text:   #92400E  → Dark text on amber backgrounds
```

### ⚪ Neutrals (Core UI)
```
Background:   #F1EFE8  → Main page background (warm off-white)
Border:       #D3D1C7  → All border elements
Surface:      #FFFFFF  → Cards, panels, modals
Canvas:       #F9F7F4  → Secondary surfaces, hover states
```

---

## Usage Examples

### 1️⃣ In React Components (TypeScript)

```tsx
import { COLORS } from '@/colors';

export function MyComponent() {
  return (
    <div style={{ backgroundColor: COLORS.neutral.background }}>
      <h1 style={{ color: COLORS.text.primary }}>Title</h1>
      <button style={{ backgroundColor: COLORS.blue.deep }}>
        Action Button
      </button>
    </div>
  );
}
```

### 2️⃣ In Tailwind Classes

```tsx
// Background colors
<div className="bg-blue-deep">Deep blue background</div>
<div className="bg-teal-full">Teal background</div>
<div className="bg-neutral-background">Page background</div>

// Text colors
<p className="text-text-primary">Primary text</p>
<p className="text-text-secondary">Secondary text</p>
<p className="text-red-full">Critical message</p>

// Border colors
<div className="border border-neutral-border">Bordered element</div>

// Hover states
<button className="bg-blue-mid hover:bg-blue-deep">Button</button>
<div className="border border-gray-300 hover:border-teal-full">Card</div>

// Status indicators
<span className="bg-teal-pale text-teal-dark">Success</span>
<span className="bg-red-light text-red-text">Critical</span>
<span className="bg-amber-light text-amber-text">Warning</span>
```

### 3️⃣ In CSS Files

```css
.header {
  background-color: var(--blue-deep);
  border-bottom: 1px solid var(--neutral-border);
  color: white;
}

.card {
  background-color: var(--neutral-surface);
  border: 1px solid var(--neutral-border);
  color: var(--text-primary);
}

.alert-critical {
  background-color: var(--red-light);
  border-left: 4px solid var(--red-full);
  color: var(--red-text);
}

.alert-warning {
  background-color: var(--amber-light);
  border-left: 4px solid var(--amber-full);
  color: var(--amber-text);
}

.badge-success {
  background-color: var(--teal-pale);
  color: var(--teal-dark);
}
```

---

## Color Application by Component

### Buttons
```tsx
// Primary Action
className="bg-blue-deep text-white hover:bg-blue-mid"

// Secondary Action  
className="border border-neutral-border text-text-primary hover:bg-neutral-canvas"

// Danger Action
className="bg-red-full text-white hover:bg-red-text"
```

### Cards/Panels
```tsx
className="bg-neutral-surface border border-neutral-border rounded-lg p-4"
```

### Status Pills/Badges
```tsx
// Success
className="bg-teal-pale text-teal-dark"

// Critical
className="bg-red-light text-red-text"

// Warning
className="bg-amber-light text-amber-text"

// Pending
className="bg-blue-lighter text-blue-deep"
```

### Text Hierarchy
```tsx
// Primary Text
className="text-text-primary font-semibold"

// Secondary Text
className="text-text-secondary"

// Tertiary/Muted Text
className="text-text-tertiary"
```

### Borders & Lines
```tsx
// Standard border
className="border border-neutral-border"

// Accent border
className="border-2 border-teal-full"

// Divider line
className="border-t border-neutral-border"
```

---

## Implementation Checklist

When styling components, follow this order:

1. ✅ Use text hierarchy colors (primary, secondary, tertiary)
2. ✅ Apply appropriate background from neutrals (surface, canvas, background)
3. ✅ Add borders using neutral-border
4. ✅ Apply semantic status colors (blue for info, teal for success, red for critical, amber for warning)
5. ✅ Use hover states with color variants

---

## Files Reference

```
src/colors/
├── palette.ts      → TypeScript color constants
├── palette.css     → CSS variable definitions (not used directly)
├── index.ts        → Module exports
└── USAGE.md        → This documentation

src/styles.css     → Main styles file that includes all color variables
```

---

## Updating Colors

If you need to change a color:

1. **TypeScript**: Update the hex value in `src/colors/palette.ts`
2. **CSS**: Update the variable in `src/styles.css` `:root` section
3. All components automatically use the updated color ✨

Example:
```tsx
// palette.ts
--blue-deep: "#185FA5"  → Change to "#1B6DB3"

// styles.css
--blue-deep: #185FA5;   → Change to #1B6DB3;
```

---

## Quick Lookup Table

| Purpose | Color | Tailwind Class | CSS Variable |
|---------|-------|----------------|--------------|
| Primary Action | Blue Deep | `bg-blue-deep` | `var(--blue-deep)` |
| Primary Text | Text Primary | `text-text-primary` | `var(--text-primary)` |
| Borders | Neutral Border | `border-neutral-border` | `var(--neutral-border)` |
| Success | Teal Full | `bg-teal-full` | `var(--teal-full)` |
| Critical | Red Full | `bg-red-full` | `var(--red-full)` |
| Warning | Amber Full | `bg-amber-full` | `var(--amber-full)` |
| Page BG | Neutral Background | `bg-neutral-background` | `var(--neutral-background)` |
| Card BG | Neutral Surface | `bg-neutral-surface` | `var(--neutral-surface)` |

---

## Accessibility Notes

- ✅ All colors meet WCAG AA contrast ratio requirements
- ✅ Don't rely solely on color; use icons and text labels too
- ✅ Status colors (red/amber/teal) have text color variants for legibility
- ✅ Test with color blindness simulators for critical UI elements

---

## Future Enhancements

- [ ] Add dark mode variants
- [ ] Add gradient combinations
- [ ] Create color theme switcher
- [ ] Add animation/transition speeds
- [ ] Generate color palettes for different specializations
