/**
 * Nisarg Women Healthcare - Color System
 * 
 * This module exports the complete color palette for the application.
 * Colors are defined in multiple formats for different use cases:
 * 
 * 1. TypeScript Constants (palette.ts) - For programmatic use in components
 * 2. CSS Custom Properties (palette.css) - For CSS styling
 * 3. Tailwind Configuration (palette.css via styles.css) - For Tailwind utilities
 */

export * from './palette';

/**
 * Quick Reference:
 * 
 * Import in React components:
 * import { COLORS } from '@/colors';
 * 
 * Usage:
 * const bgColor = COLORS.blue.deep;
 * const textColor = COLORS.text.primary;
 * 
 * In Tailwind classes:
 * className="bg-blue-deep text-teal-full border border-neutral-border"
 * 
 * In CSS:
 * background-color: var(--blue-deep);
 * border: 1px solid var(--neutral-border);
 */
