# Frontend UI Style Guide

## Color Palette

### Primary Colors
- **Primary**: `#4F46E5` (Blue/Indigo)
- **Primary Light**: `#818CF8` (Light Indigo)
- **Primary Dark**: `#4338CA` (Dark Indigo)

### Neutral Grays
- **Background**: `#F9FAFB`
- **Card Background**: `#F3F4F6`
- **Border**: `#E5E7EB`
- **Text Primary**: `#111827`
- **Text Secondary**: `#6B7280`
- **Text Muted**: `#9CA3AF`

### Status Colors
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Yellow)

## Typography

### Font Stack
- **Primary Font**: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif

### Heading Sizes
- **H1**: 2rem (32px)
- **H2**: 1.5rem (24px)
- **H3**: 1.25rem (20px)

### Body Text
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System

### Base Unit
- **Base Unit**: 4px (0.25rem)

### Spacing Scale
- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 7: 1.75rem (28px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)

## Component Usage

### Button Component
- **Variants**: primary, secondary, ghost, destructive
- **Sizes**: sm (small), md (medium), lg (large)
- **States**: normal, hover, active, focus, disabled

### Card Component
- **Standard Card**: Default styling with border and shadow
- **Card Header**: Contains title and optional description
- **Card Content**: Main content area
- **Card Footer**: Action buttons or additional information

### Input Component
- **Types**: text, password, email, textarea
- **States**: normal, focus, error, success
- **Validation**: Built-in error and success indicators

## Responsive Breakpoints

### Mobile First
- **Mobile**: 0px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

### Grid System
- **Columns**: 1, 2, 3, 4 columns depending on screen size
- **Gaps**: Consistent spacing using the spacing scale

## Accessibility Features

### Focus Management
- **Focus Ring**: 2px solid `#60A5FA` with 2px offset
- **Focus Visibility**: Always visible on keyboard navigation

### Reduced Motion
- **Animation Duration**: Limited to 0.01ms when user prefers reduced motion
- **Transition Duration**: Limited to 0.01ms when user prefers reduced motion

### High Contrast Mode
- **Enhanced Borders**: 2px borders for better visibility
- **Increased Contrast**: Higher contrast color schemes

## Animations & Transitions

### Durations
- **Fast**: 150ms
- **Normal**: 250ms
- **Slow**: 300ms

### Easing
- **Primary Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

### Animation Utilities
- **Fade In**: Smooth opacity transition
- **Slide Up**: Combined opacity and position transition
- **Elevation**: Subtle lift effect on hover