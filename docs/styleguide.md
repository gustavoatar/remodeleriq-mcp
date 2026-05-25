# RemodelerIQ Typography Style Guide

## Font Family

**Primary Font:** Inter (Google Fonts)  
**Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extra Bold)

```css
font-family: 'Inter', system-ui, sans-serif;
```

---

## Color Palette for Text

| Usage | Color | Hex | Tailwind Class |
|-------|-------|-----|----------------|
| Headings | Dark charcoal | `#333` | `text-heading` or `text-navy-900` |
| Body text | Medium gray | `#555` | `text-body` or `text-gray-600` |
| Primary brand | Green | `#1F9C4C` | `text-brand-500` |
| Muted/secondary | Slate | — | `text-slate-600`, `text-navy-600` |
| White (on dark bg) | White | `#FFF` | `text-white` |

---

## Type Scale

### Hero Headlines (H1)
The largest, most impactful text on the page. Used once per page maximum.

```
text-4xl sm:text-5xl md:text-6xl font-bold leading-tight
```

**Example:**
- "Negotiate like a pro on your next remodel"

---

### Section Headlines (H2)
Major section dividers. Establishes hierarchy for page sections.

```
text-3xl font-semibold
```

**Example:**
- Pricing section headers
- "How It Works"

---

### Card Headlines (H3)
Used for card titles and subsection headers.

```
text-lg font-bold text-navy-900
```

**Example:**
- "Unit Count Breakdown"
- "Price Analysis"

---

### Data/Metric Labels (H4)
Used above data points or metrics.

```
text-xs font-semibold text-navy-500 uppercase tracking-wider
```

**Example:**
- "ESTIMATED SAVINGS"
- "CONFIDENCE SCORE"

---

### Body Text (Large)
Hero subheadlines and emphasized body copy.

```
text-lg sm:text-xl leading-relaxed
```
Color: `#555` or `text-body`

---

### Body Text (Standard)
Default paragraph text throughout the app.

```
text-base font-normal
```
Color: `#555` or `text-gray-600`

---

### Small/Supporting Text
Captions, footnotes, helper text.

```
text-sm font-medium text-gray-600
```

---

### Micro Text
Badges, labels, timestamps.

```
text-xs font-medium
```

---

## Font Weight Usage

| Weight | Tailwind | When to Use |
|--------|----------|-------------|
| 700–800 | `font-bold` | Headlines, key metrics, CTAs |
| 600 | `font-semibold` | Card headers, emphasized labels |
| 500 | `font-medium` | Interactive elements, buttons, links |
| 400 | `font-normal` | Body text, descriptions |

---

## Semantic Text Patterns

### Primary CTA Buttons
```
font-bold text-xl text-white
```
Background: `#1F9C4C` (brand green)

---

### Secondary Buttons/Links
```
font-medium text-base text-gray-600 hover:text-emerald-600
```

---

### Badge/Pill Labels
```
px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700
```

Variants:
- Success: `bg-emerald-100 text-emerald-700`
- Warning: `bg-amber-100 text-amber-700`
- Info: `bg-blue-100 text-blue-700`
- Danger: `bg-red-100 text-red-700`

---

### Metric/Score Display
Large numerical values for scores, prices, percentages.

```
text-3xl font-bold text-navy-900
```

For colored metrics:
- Positive: `text-emerald-600`
- Neutral: `text-blue-600`
- Warning: `text-amber-600`
- Negative: `text-red-600`

---

## Card Typography Hierarchy

A typical card follows this pattern (top to bottom):

1. **Eyebrow** (optional)
   ```
   text-xs font-semibold text-navy-500 uppercase tracking-wider
   ```

2. **Card Title**
   ```
   text-lg font-bold text-navy-900
   ```

3. **Card Description**
   ```
   text-sm text-gray-600
   ```

4. **Metric Value**
   ```
   text-2xl font-bold text-navy-900
   ```

5. **Supporting Label**
   ```
   text-xs font-medium text-navy-600
   ```

---

## Responsive Typography

Headlines scale down on mobile:

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero H1 | `text-4xl` | `text-5xl` | `text-6xl` |
| Section H2 | `text-2xl` | `text-3xl` | `text-3xl` |
| Body large | `text-lg` | `text-xl` | `text-xl` |

---

## Line Height

| Usage | Tailwind | Description |
|-------|----------|-------------|
| Headlines | `leading-tight` | Compact, impactful |
| Body text | `leading-relaxed` | Easy reading |
| Lists/data | `leading-normal` | Default spacing |

---

## Letter Spacing

- **Uppercase labels:** `tracking-wider` or `tracking-wide`
- **Headlines:** Default (no adjustment)
- **Body:** Default

---

## Text Color Utilities

Custom utility classes defined in `index.css`:

```css
.text-heading { color: #333; }
.text-body { color: #555; }
```

---

## Do's and Don'ts

### ✅ Do
- Use `font-bold` for headlines, `font-semibold` for subheads
- Apply brand green (`#1F9C4C`) for primary emphasis
- Use uppercase + tracking-wider for small labels
- Maintain consistent heading hierarchy (H1 → H2 → H3)

### ❌ Don't
- Mix multiple headline sizes in the same card
- Use `font-light` for interactive elements
- Apply colored text to body paragraphs
- Skip heading levels (H1 → H3)

---

## Quick Reference

```jsx
// Hero headline
<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">

// Section headline  
<h2 className="text-3xl font-semibold text-navy-900">

// Card title
<h3 className="text-lg font-bold text-navy-900">

// Eyebrow/label
<p className="text-xs font-semibold text-navy-500 uppercase tracking-wider">

// Body text
<p className="text-base text-gray-600 leading-relaxed">

// Primary CTA
<button className="font-bold text-xl text-white bg-brand-500">

// Badge
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
```
