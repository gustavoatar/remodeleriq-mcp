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
  // Labels sit ABOVE each bar (left-aligned) so arbitrarily long category names
  // (e.g. "San Francisco-Oakland-Hayward, CA") never overflow a fixed left gutter
  // and get clipped. Right padding leaves room for the value label after the bar.
  const padLeft = 28;
  const padRight = 100;
  const padTop = 78;
  const padBottom = 56;
  const labelH = 24; // vertical space for the category label above each bar
  const barH = 34;
  const rowGap = 18;
  const rowH = labelH + barH;
  // Normalize rows — Gemini sometimes emits rows without value
  const rows = (data.rows || []).map((r) => ({
    ...r,
    value: typeof r.value === "number" && isFinite(r.value) ? r.value : 0,
  }));
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const H = padTop + sorted.length * (rowH + rowGap) + padBottom;
  const max = Math.max(...sorted.map((r) => r.value), 1);
  const chartWidth = W - padLeft - padRight;

  const bgColor = theme === "dark" ? PALETTE.bg_dark : PALETTE.bg_card;
  const titleColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const labelColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const subColor = theme === "dark" ? "#94a3b8" : PALETTE.text_muted;

  const bars = sorted
    .map((row, i) => {
      const rowY = padTop + i * (rowH + rowGap);
      const barY = rowY + labelH;
      const barWidth = max > 0 ? (row.value / max) * chartWidth : 0;
      const fill = row.highlight ? PALETTE.accent : PALETTE.primary;
      const valueLabel = `${fmt(row.value, data.format)}${data.unit || ""}`;
      return `
  <text x="${padLeft}" y="${rowY + 16}" text-anchor="start" font-size="14" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(row.label)}</text>
  <rect x="${padLeft}" y="${barY}" width="${barWidth}" height="${barH}" fill="${fill}" rx="4"/>
  <text x="${padLeft + barWidth + 10}" y="${barY + barH / 2 + 5}" text-anchor="start" font-size="14" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(valueLabel)}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(data.title)}" style="width:100%;height:auto;background:${bgColor};border-radius:12px;">
  <text x="${W / 2}" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="${titleColor}" font-family="Inter, system-ui, sans-serif">${esc(data.title)}</text>
  ${data.subtitle ? `<text x="${W / 2}" y="58" text-anchor="middle" font-size="13" fill="${subColor}" font-family="Inter, system-ui, sans-serif">${esc(data.subtitle)}</text>` : ""}
  ${bars}
  <text x="${W - padRight}" y="${H - 20}" text-anchor="end" font-size="11" fill="${subColor}" font-family="Inter, system-ui, sans-serif" font-style="italic">Source: ${esc(data.source)}</text>
</svg>`;
}

// ====================================================================
// Comparison bars — side-by-side fair-vs-padded comparison
// ====================================================================
export function renderComparisonBarsSvg(data: ComparisonBarsData): string {
  const theme = data.theme || "light";
  const W = 800;
  // Labels above each pair of bars (left-aligned) — no fixed left gutter to clip.
  const padLeft = 28;
  const padRight = 96;
  const padTop = 100;
  const padBottom = 80;
  const labelH = 24;
  const barH = 28;
  const barGap = 5;
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
  const rowBlockH = labelH + barH * 2 + barGap;
  const rowGap = 20;
  const H = padTop + rows.length * (rowBlockH + rowGap) + padBottom;
  const allVals = rows.flatMap((r) => [r.left, r.right]);
  const max = Math.max(...allVals, 1);
  // Coerce labels to non-undefined
  const leftLabel = data.left_label || "Fair";
  const rightLabel = data.right_label || "Padded";
  const chartWidth = W - padLeft - padRight;

  const bgColor = theme === "dark" ? PALETTE.bg_dark : PALETTE.bg_card;
  const titleColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const labelColor = theme === "dark" ? PALETTE.text_light : PALETTE.text_dark;
  const subColor = theme === "dark" ? "#94a3b8" : PALETTE.text_muted;

  const renderedRows = rows
    .map((row, i) => {
      const rowY = padTop + i * (rowBlockH + rowGap);
      const leftY = rowY + labelH;
      const rightY = leftY + barH + barGap;
      const leftW = max > 0 ? (row.left / max) * chartWidth : 0;
      const rightW = max > 0 ? (row.right / max) * chartWidth : 0;
      return `
  <text x="${padLeft}" y="${rowY + 16}" text-anchor="start" font-size="14" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(row.label)}</text>
  <rect x="${padLeft}" y="${leftY}" width="${leftW}" height="${barH}" fill="${PALETTE.primary}" rx="3"/>
  <text x="${padLeft + leftW + 8}" y="${leftY + barH / 2 + 5}" text-anchor="start" font-size="13" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(fmt(row.left, data.format))}</text>
  <rect x="${padLeft}" y="${rightY}" width="${rightW}" height="${barH}" fill="#ef4444" rx="3"/>
  <text x="${padLeft + rightW + 8}" y="${rightY + barH / 2 + 5}" text-anchor="start" font-size="13" font-weight="700" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(fmt(row.right, data.format))}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(data.title)}" style="width:100%;height:auto;background:${bgColor};border-radius:12px;">
  <text x="${W / 2}" y="36" text-anchor="middle" font-size="20" font-weight="800" fill="${titleColor}" font-family="Inter, system-ui, sans-serif">${esc(data.title)}</text>
  ${data.subtitle ? `<text x="${W / 2}" y="58" text-anchor="middle" font-size="13" fill="${subColor}" font-family="Inter, system-ui, sans-serif">${esc(data.subtitle)}</text>` : ""}

  <rect x="${padLeft}" y="70" width="14" height="14" fill="${PALETTE.primary}" rx="2"/>
  <text x="${padLeft + 22}" y="82" font-size="13" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(leftLabel)}</text>
  <rect x="${padLeft + 200}" y="70" width="14" height="14" fill="#dc2626" rx="2"/>
  <text x="${padLeft + 222}" y="82" font-size="13" font-weight="600" fill="${labelColor}" font-family="Inter, system-ui, sans-serif">${esc(rightLabel)}</text>

  ${renderedRows}
  <text x="${W - padRight}" y="${H - 20}" text-anchor="end" font-size="11" fill="${subColor}" font-family="Inter, system-ui, sans-serif" font-style="italic">Source: ${esc(data.source)}</text>
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
