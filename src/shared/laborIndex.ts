// Pure computations for the Construction Labor Index page. Deterministic —
// runs at build/prerender time from laborIndexData.ts, no runtime fetch.
import {
  NATIONAL_TRADES,
  METROS,
  REGRESSION_POINTS,
  LABOR_ESCALATION,
  type TradeWage,
  type MetroIndex,
} from "./laborIndexData";

export interface OLSResult {
  slope: number;
  intercept: number;
  r: number;
  r2: number;
  n: number;
  /** predicted y at a given x */
  predict: (x: number) => number;
}

export function ols(points: { x: number; y: number }[]): OLSResult {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r, r2: r * r, n, predict: (x) => slope * x + intercept };
}

/** The validation regression: BLS composite median wage vs the cost index. */
export function indexRegression(): OLSResult {
  return ols(REGRESSION_POINTS.map((p) => ({ x: p.index, y: p.blsMedian })));
}

/** Billed labor rate for a trade at the national level, escalated to 2026. */
export function billedRate(t: TradeWage): number {
  return t.median * t.burden * LABOR_ESCALATION;
}

/** 10th- and 90th-percentile billed rates (the "quote variance" band). */
export function billedBand(t: TradeWage): { low: number; high: number; spread: number } {
  const low = t.p10 * t.burden * LABOR_ESCALATION;
  const high = t.p90 * t.burden * LABOR_ESCALATION;
  return { low, high, spread: high / low };
}

export interface TradeRow {
  soc: string;
  trade: string;
  billedMedian: number;
  billedLow: number;
  billedHigh: number;
  spread: number;
}

/** National trade table, ranked by billed median (most to least expensive). */
export function nationalTradeTable(): TradeRow[] {
  return NATIONAL_TRADES.map((t) => {
    const band = billedBand(t);
    return {
      soc: t.soc,
      trade: t.trade,
      billedMedian: billedRate(t),
      billedLow: band.low,
      billedHigh: band.high,
      spread: band.spread,
    };
  }).sort((a, b) => b.billedMedian - a.billedMedian);
}

export interface MetroRow extends MetroIndex {
  /** blended billed labor rate for a "typical trade mix" in this metro */
  blendedRate: number;
  premiumPct: number; // vs national (index-1)*100
}

/** The blended national billed rate across the core remodeling trades — the
 *  anchor that each metro's index scales. Uses the 5 trades on a typical
 *  remodel (carpenter, electrician, plumber, HVAC, laborer) equally weighted. */
export function nationalBlendedRate(): number {
  const core = ["47-2031", "47-2111", "47-2152", "49-9021", "47-2061"];
  const picks = NATIONAL_TRADES.filter((t) => core.includes(t.soc));
  return picks.reduce((a, t) => a + billedRate(t), 0) / picks.length;
}

/** 152-metro billed-rate table (blended core-trade rate × metro index). */
export function metroTable(): MetroRow[] {
  const base = nationalBlendedRate();
  return METROS.map((m) => ({
    ...m,
    blendedRate: base * m.index,
    premiumPct: Math.round((m.index - 1) * 100),
  }));
}

/** CSV of the full metro × trade billed-rate matrix, for download. */
export function metroTradeCsv(): string {
  const trades = nationalTradeTable();
  const header = ["metro", "state", "cost_index", ...trades.map((t) => t.trade.replace(/,/g, ""))];
  const lines = [header.join(",")];
  for (const m of METROS) {
    const row = [
      `${m.city}`,
      m.st,
      m.index.toFixed(2),
      ...trades.map((t) => (t.billedMedian * m.index).toFixed(2)),
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function fmtUSD(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
export function fmtRate(n: number): string {
  return `$${n.toFixed(0)}/hr`;
}
