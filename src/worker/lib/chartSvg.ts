// Phase 7C v2 — Inline SVG chart renderer
// Server-side SVG generation. No JS dependencies. Embeds cleanly into Gutenberg
// post content. Brand palette: slate-900 backgrounds, emerald-500 primary,
// slate-400 secondary, with white labels for dark themes.

export type ChartType = "bar" | "donut" | "comparison_bars";

export interface BarChartData {
  title: string;
  subtitle?: string;
  source: string;
  unit: string;       // e.g., "/hr", "%", "$"
  format?: "currency" | "percent" | "raw";
  rows: { label: string; value: number; highlight?: boolean }[];
  theme?: "light" | "dark";
}

export interface ComparisonBarsData {
  title: string;
  subtitle?: string;
  source: string;
  format?: "currency" | "percent" | "raw";
  left_label: string;
  right_label: string;
  rows: { label: string; left: number; right: number }[];
  theme?: "light" | "dark";
}

export interface DonutData {
  title: string;
  source: string;
  rows: { label: string; value: number; color?: string }[];
  theme?: "light" | "dark";
}

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(value: number | undefined | null, format: "currency" | "percent" | "raw" = "raw"): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  if (format === "currency") {
    if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  }
  if (format === "percent") return `${n.toFixed(1)}%`;
  return n.toLocaleString();
}

// Brand palette — uses the canonical brand green #1F9C4C consistent with
// remodeleriq.com email templates and CTAs (NOT generic Tailwind emerald).
const PALETTE = {
  primary: "#1F9C4C",      // RemodelerIQ brand green
  primary_dark: "#157a3a", // darker brand green
  accent: "#f59e0b",       // amber-500
  text_dark: "#0f172a",    // slate-900
  text_muted: "#475569",   // slate-600
  text_light: "#f8fafc",   // slate-50
  bg_dark: "#0f172a",      // slate-900
  bg_panel: "#f1f5f9",     // slate-100
  bg_card: "#ffffff",
  border: "#e2e8f0",       // slate-200
  grid: "#cbd5e1",         // slate-300
};

// ====================================================================
// Bar chart — horizontal bars, sorted by value
// ====================================================================
export function renderBarChartSvg(data: BarChartData): string {
  const theme = data.theme || "light";
  const W = 800;
  const padding = { top: 80, right: 80, bottom: 60, left: 200 };
  const rowH = 38;
  const rowGap = 8;
  // Normalize rows — Gemini sometimes emits rows without value
  const rows = (data.rows || []).map((r) => ({
    ...r,
    value: typeof r.value === "number" && isFinite(r.value) ? r.value : 0,
  }));
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const H = padding.top + sorted.length * (rowH + rowGap) + padding.bottom;
  const max = Math.max(...sorted.map((r) => r.value));
  const chartWidth = W - padding.left - padding.right;

  const bgColor = theme === "dark" ? PALETTE.bg_dark : PALETTE.bg_card;
  const titleColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const labelColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const subColor = theme === "dark" ? "#94a3b8" : PALETTE.text_muted;

  const bars = sorted
    .map((row, i) => {
      const y = padding.top + i * (rowH + rowGap);
      const barWidth = max > 0 ? (row.value / max) * chartWidth : 0;
      const fill = row.highlight ? PALETTE.accent : PALETTE.primary;
      const valueLabel = `${fmt(row.value, data.format)}${data.unit || ""}`;
      return `
  <text x="${padding.left - 12}" y="${y + rowH / 2 + 5}" text-anchor="end" font-size="14" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(row.label)}</text>
  <rect x="${padding.left}" y="${y}" width="${barWidth}" height="${rowH}" fill="${fill}" rx="4"/>
  <text x="${padding.left + barWidth + 8}" y="${y + rowH / 2 + 5}" font-size="14" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(valueLabel)}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(data.title)}" style="width:100%;height:auto;background:${bgColor};border-radius:12px;">
  <text x="${W / 2}" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="${titleColor}" font-family="Inter, system-ui, sans-serif">${esc(data.title)}</text>
  ${data.subtitle ? `<text x="${W / 2}" y="58" text-anchor="middle" font-size="13" fill="${subColor}" font-family="Inter, system-ui, sans-serif">${esc(data.subtitle)}</text>` : ""}
  ${bars}
  <text x="${W - padding.right}" y="${H - 20}" text-anchor="end" font-size="11" fill="${subColor}" font-family="Inter, system-ui, sans-serif" font-style="italic">Source: ${esc(data.source)}</text>
</svg>`;
}

// ====================================================================
// Comparison bars — side-by-side fair-vs-padded comparison
// ====================================================================
export function renderComparisonBarsSvg(data: ComparisonBarsData): string {
  const theme = data.theme || "light";
  const W = 800;
  const padding = { top: 100, right: 60, bottom: 80, left: 180 };
  const rowH = 32;
  const rowGap = 14;
  // Normalize rows — Gemini sometimes emits rows without left/right OR uses
  // different field names. Fall back to 0 for missing values.
  const rows = (data.rows || []).map((r) => {
    const anyR = r as unknown as Record<string, unknown>;
    const left = typeof r.left === "number" ? r.left
      : typeof anyR.fair === "number" ? (anyR.fair as number)
      : typeof anyR.low === "number" ? (anyR.low as number)
      : typeof anyR.before === "number" ? (anyR.before as number)
      : 0;
    const right = typeof r.right === "number" ? r.right
      : typeof anyR.padded === "number" ? (anyR.padded as number)
      : typeof anyR.high === "number" ? (anyR.high as number)
      : typeof anyR.after === "number" ? (anyR.after as number)
      : 0;
    return { label: r.label || "—", left, right };
  });
  const H = padding.top + rows.length * (rowH * 2 + rowGap) + padding.bottom;
  const allVals = rows.flatMap((r) => [r.left, r.right]);
  const max = Math.max(...allVals, 1);
  // Coerce labels to non-undefined
  const leftLabel = data.left_label || "Fair";
  const rightLabel = data.right_label || "Padded";
  const chartWidth = W - padding.left - padding.right;

  const bgColor = theme === "dark" ? PALETTE.bg_dark : PALETTE.bg_card;
  const titleColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const labelColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const subColor = theme === "dark" ? "#94a3b8" : PALETTE.text_muted;

  const renderedRows = rows
    .map((row, i) => {
      const y = padding.top + i * (rowH * 2 + rowGap);
      const leftW = max > 0 ? (row.left / max) * chartWidth : 0;
      const rightW = max > 0 ? (row.right / max) * chartWidth : 0;
      return `
  <text x="${padding.left - 12}" y="${y + rowH + 6}" text-anchor="end" font-size="14" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(row.label)}</text>
  <rect x="${padding.left}" y="${y}" width="${leftW}" height="${rowH - 2}" fill="${PALETTE.primary}" rx="3"/>
  <text x="${padding.left + leftW + 8}" y="${y + (rowH - 2) / 2 + 5}" font-size="13" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(fmt(row.left, data.format))}</text>
  <rect x="${padding.left}" y="${y + rowH}" width="${rightW}" height="${rowH - 2}" fill="#ef4444" rx="3"/>
  <text x="${padding.left + rightW + 8}" y="${y + rowH + (rowH - 2) / 2 + 5}" font-size="13" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(fmt(row.right, data.format))}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(data.title)}" style="width:100%;height:auto;background:${bgColor};border-radius:12px;">
  <text x="${W / 2}" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="${titleColor}" font-family="Inter, system-ui, sans-serif">${esc(data.title)}</text>
  ${data.subtitle ? `<text x="${W / 2}" y="58" text-anchor="middle" font-size="13" fill="${subColor}" font-family="Inter, system-ui, sans-serif">${esc(data.subtitle)}</text>` : ""}

  <rect x="${padding.left}" y="70" width="14" height="14" fill="${PALETTE.primary}" rx="2"/>
  <text x="${padding.left + 22}" y="82" font-size="13" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(leftLabel)}</text>
  <rect x="${padding.left + 200}" y="70" width="14" height="14" fill="#dc2626" rx="2"/>
  <text x="${padding.left + 222}" y="82" font-size="13" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(rightLabel)}</text>

  ${renderedRows}
  <text x="${W - padding.right}" y="${H - 20}" text-anchor="end" font-size="11" fill="${subColor}" font-family="Inter, system-ui, sans-serif" font-style="italic">Source: ${esc(data.source)}</text>
</svg>`;
}

// ====================================================================
// Donut chart — for bid breakdowns and pillar weightings
// ====================================================================
export function renderDonutSvg(data: DonutData): string {
  const theme = data.theme || "light";
  const W = 720;
  const H = 460;
  const cx = 220;
  const cy = 230;
  const outerR = 150;
  const innerR = 95;
  // Normalize rows — guarantee value is a number
  const rows = (data.rows || []).map((r) => ({
    ...r,
    value: typeof r.value === "number" && isFinite(r.value) ? r.value : 0,
    label: r.label || "—",
  }));
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;

  const bgColor = theme === "dark" ? PALETTE.bg_dark : PALETTE.bg_card;
  const titleColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const labelColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const subColor = theme === "dark" ? "#94a3b8" : PALETTE.text_muted;

  // Default color rotation for slices
  const SLICE_COLORS = ["#10b981", "#3b82f6", "#fbbf24", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

  let angleStart = -Math.PI / 2;
  const slices = rows
    .map((row, i) => {
      const angle = (row.value / total) * Math.PI * 2;
      const angleEnd = angleStart + angle;
      const x1 = cx + outerR * Math.cos(angleStart);
      const y1 = cy + outerR * Math.sin(angleStart);
      const x2 = cx + outerR * Math.cos(angleEnd);
      const y2 = cy + outerR * Math.sin(angleEnd);
      const x1i = cx + innerR * Math.cos(angleEnd);
      const y1i = cy + innerR * Math.sin(angleEnd);
      const x2i = cx + innerR * Math.cos(angleStart);
      const y2i = cy + innerR * Math.sin(angleStart);
      const largeArc = angle > Math.PI ? 1 : 0;
      const color = row.color || SLICE_COLORS[i % SLICE_COLORS.length];
      const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
      angleStart = angleEnd;
      return `<path d="${path}" fill="${color}"/>`;
    })
    .join("");

  const legend = rows
    .map((row, i) => {
      const color = row.color || SLICE_COLORS[i % SLICE_COLORS.length];
      const pct = ((row.value / total) * 100).toFixed(0);
      const y = 100 + i * 36;
      return `
  <rect x="430" y="${y}" width="16" height="16" fill="${color}" rx="3"/>
  <text x="455" y="${y + 13}" font-size="14" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(row.label)}</text>
  <text x="${W - 30}" y="${y + 13}" text-anchor="end" font-size="14" font-weight="700" fill="${color}" font-family="Inter, system-ui, sans-serif">${pct}%</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(data.title)}" style="width:100%;height:auto;background:${bgColor};border-radius:12px;">
  <text x="${W / 2}" y="40" text-anchor="middle" font-size="20" font-weight="800" fill="${titleColor}" font-family="Inter, system-ui, sans-serif">${esc(data.title)}</text>
  ${slices}
  ${legend}
  <text x="${W - 30}" y="${H - 20}" text-anchor="end" font-size="11" fill="${subColor}" font-family="Inter, system-ui, sans-serif" font-style="italic">Source: ${esc(data.source)}</text>
</svg>`;
}
