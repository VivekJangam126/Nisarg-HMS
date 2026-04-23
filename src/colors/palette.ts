/**
 * Nisarg Women Healthcare - Color Palette
 * Centralized color definitions for consistent branding across the application
 */

export const COLORS = {
  // Blue Family - Structural backbone
  blue: {
    deep: "#185FA5",    // Primary actions, sidebar
    mid: "#378ADD",     // Secondary elements, ward bars, avatars
    light: "#5BA3E8",   // Hover states, subtle backgrounds
    lighter: "#E3EEF8", // Light backgrounds
  },

  // Teal - Positive/Stable outcomes
  teal: {
    full: "#1D9E75",    // Discharged status, stable indicators
    pale: "#D8F3E8",    // Status pill background
    dark: "#0F6D54",    // Text on teal backgrounds
  },

  // Red - Critical/Urgent signals
  red: {
    full: "#DC2626",    // Critical alerts, nav badges, urgent indicators
    light: "#FEE2E2",   // Light backgrounds for red messages
    text: "#991B1B",    // Dark text on red backgrounds
  },

  // Amber - Caution/Warning zone
  amber: {
    full: "#D97706",    // Pending labs, warning alerts
    light: "#FEF3C7",   // Light backgrounds for warnings
    text: "#92400E",    // Dark text on amber backgrounds
  },

  // Neutrals - Core UI
  neutral: {
    background: "#F1EFE8",   // Warm off-white page background (not pure white)
    border: "#D3D1C7",       // Single border color used everywhere
    surface: "#FFFFFF",      // Card/panel backgrounds
    canvas: "#F9F7F4",       // Secondary surfaces, hover states
  },

  // Grayscale for text hierarchy
  text: {
    primary: "#1F2937",      // Primary text (ink-900)
    secondary: "#6B7280",    // Secondary text (ink-600)
    tertiary: "#A3A29F",     // Tertiary text (ink-300)
  },

  // Semantic colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

/**
 * Usage in CSS:
 * Use CSS variables defined in palette.css
 * Example: background-color: var(--blue-deep);
 *
 * Usage in TypeScript:
 * Import and use directly
 * Example: const bgColor = COLORS.blue.deep;
 *
 * Usage in Tailwind:
 * Update tailwind.config.js to include these colors
 * Then use in classes: bg-blue-deep, text-teal-full, etc.
 */
