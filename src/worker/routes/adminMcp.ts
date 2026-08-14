// Admin API for the MCP telemetry dashboard (/admin/mcp).
// Auth: same session-cookie + email-allowlist pattern as all other admin routes.
// Four views: usage, corpus health, abuse detection, attribution funnel.

import { Hono } from "hono";
import { getCookie } from "hono/cookie";

const SESSION_COOKIE = "remodeleriq_session";

type AdminEnv = { Bindings: Env };

const router = new Hono<AdminEnv>();

// ---- Auth helper -----------------------------------------------------------
function isAdminEmail(email: string, env: unknown): boolean {
  const list = (
    (env as Record<string, unknown>).ADMIN_EMAILS as string | undefined ??
    "gustavo.atar@gmail.com,gustavo@remodeleriq.com"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}

async function requireAdmin(c: { req: { raw: Request }; env: Env }): Promise<boolean> {
  const token = getCookie(c as Parameters<typeof getCookie>[0], SESSION_COOKIE);
  if (!token) return false;
  try {
    const session = await c.env.DB.prepare(
      'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > datetime("now")'
    )
      .bind(token)
      .first<{ user_id: number }>();
    if (!session) return false;
    const user = await c.env.DB.prepare("SELECT email FROM user_profiles WHERE id = ?")
      .bind(session.user_id)
      .first<{ email: string }>();
    return !!user && isAdminEmail(user.email, c.env);
  } catch {
    return false;
  }
}

// ---- A. Usage overview -----------------------------------------------------
router.get("/usage", async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Forbidden" }, 403);

  const db = c.env.DB;

  const [totalRow, byTool, byDay, byClient, latencyRow, errorRow] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM mcp_calls_v2").first<{ n: number }>(),
    db.prepare(`
      SELECT tool_name, COUNT(*) AS n
      FROM mcp_calls_v2
      GROUP BY tool_name ORDER BY n DESC
    `).all<{ tool_name: string; n: number }>(),
    db.prepare(`
      SELECT date(ts) AS day, COUNT(*) AS n
      FROM mcp_calls_v2
      WHERE ts >= datetime('now', '-30 days')
      GROUP BY day ORDER BY day DESC
    `).all<{ day: string; n: number }>(),
    db.prepare(`
      SELECT COALESCE(client_name, 'unknown') AS client, origin_class,
             COUNT(*) AS n
      FROM mcp_calls_v2
      WHERE ts >= datetime('now', '-30 days')
      GROUP BY client, origin_class ORDER BY n DESC LIMIT 30
    `).all<{ client: string; origin_class: string; n: number }>(),
    db.prepare(`
      SELECT
        CAST(ROUND(AVG(latency_ms)) AS INTEGER) AS p50_approx,
        MAX(latency_ms) AS p_max
      FROM mcp_calls_v2
      WHERE ts >= datetime('now', '-7 days') AND latency_ms IS NOT NULL
    `).first<{ p50_approx: number | null; p_max: number | null }>(),
    db.prepare(`
      SELECT COUNT(*) AS n FROM mcp_calls_v2
      WHERE status != 'ok' AND ts >= datetime('now', '-7 days')
    `).first<{ n: number }>(),
  ]);

  return c.json({
    total_calls: totalRow?.n ?? 0,
    by_tool: byTool.results,
    calls_by_day: byDay.results,
    client_breakdown: byClient.results,
    latency: latencyRow,
    error_count_7d: errorRow?.n ?? 0,
  });
});

// ---- B. Corpus health ------------------------------------------------------
router.get("/corpus", async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Forbidden" }, 403);

  const db = c.env.DB;

  const [totalRow, weeklyRow, cellCounts, avgCoverage, topFlags] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM bid_submissions").first<{ n: number }>(),
    db.prepare(`
      SELECT strftime('%Y-W%W', submitted_at) AS week, COUNT(*) AS n
      FROM bid_submissions
      WHERE submitted_at >= datetime('now', '-90 days')
      GROUP BY week ORDER BY week DESC
    `).all<{ week: string; n: number }>(),
    db.prepare(`
      SELECT state_code, project_type, COUNT(*) AS n
      FROM bid_submissions
      WHERE state_code IS NOT NULL AND project_type IS NOT NULL
      GROUP BY state_code, project_type
      ORDER BY n DESC
    `).all<{ state_code: string; project_type: string; n: number }>(),
    db.prepare(`
      SELECT ROUND(AVG(extraction_coverage), 3) AS avg_coverage
      FROM bid_submissions WHERE extraction_coverage IS NOT NULL
    `).first<{ avg_coverage: number | null }>(),
    db.prepare(`
      SELECT bf.flag_id, fd.severity, fd.title, COUNT(*) AS n
      FROM bid_flags bf
      LEFT JOIN flag_definitions fd ON bf.flag_id = fd.flag_id
      GROUP BY bf.flag_id ORDER BY n DESC LIMIT 20
    `).all<{ flag_id: string; severity: string; title: string; n: number }>(),
  ]);

  return c.json({
    total_submissions: totalRow?.n ?? 0,
    submissions_per_week: weeklyRow.results,
    fill_by_cell: cellCounts.results,        // heatmap: distance from 30-submission target
    avg_extraction_coverage: avgCoverage?.avg_coverage ?? null,
    top_flags: topFlags.results,
  });
});

// ---- C. Abuse and anomaly --------------------------------------------------
router.get("/abuse", async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Forbidden" }, 403);

  const db = c.env.DB;

  // Sessions ranked by anomaly signals in the last 48 hours
  const sessions = await db.prepare(`
    SELECT
      session_id,
      COALESCE(client_name, 'unknown') AS client_name,
      origin_class,
      COUNT(*) AS total_calls,
      SUM(CASE WHEN tool_name = 'get_cost_estimate' THEN 1 ELSE 0 END) AS cost_calls,
      SUM(CASE WHEN tool_name = 'analyze_bid' THEN 1 ELSE 0 END) AS bid_calls,
      MIN(ts) AS first_call,
      MAX(ts) AS last_call
    FROM mcp_calls_v2
    WHERE ts >= datetime('now', '-48 hours')
      AND session_id IS NOT NULL
    GROUP BY session_id, client_name, origin_class
    HAVING total_calls >= 5
    ORDER BY total_calls DESC
    LIMIT 50
  `).all<{
    session_id: string; client_name: string; origin_class: string;
    total_calls: number; cost_calls: number; bid_calls: number;
    first_call: string; last_call: string;
  }>();

  // Sessions with extreme volumes (possible scrapers / institutional)
  const highVolume = await db.prepare(`
    SELECT
      session_id,
      COALESCE(client_name, 'unknown') AS client_name,
      COUNT(*) AS total_calls
    FROM mcp_calls_v2
    WHERE ts >= datetime('now', '-48 hours')
      AND session_id IS NOT NULL
    GROUP BY session_id
    HAVING total_calls >= 50
    ORDER BY total_calls DESC
    LIMIT 20
  `).all<{ session_id: string; client_name: string; total_calls: number }>();

  return c.json({
    sessions_48h: sessions.results.map((s) => ({
      ...s,
      // Ratio > 10 signals cost-data scraping (no bid to analyze, just harvesting estimates)
      scraper_ratio: s.bid_calls > 0 ? +(s.cost_calls / s.bid_calls).toFixed(1) : null,
    })),
    high_volume_sessions: highVolume.results,
  });
});

// ---- D. Attribution funnel -------------------------------------------------
router.get("/attribution", async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Forbidden" }, 403);

  const db = c.env.DB;

  const [totals, byTool, recent] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS pre_stored,
        SUM(CASE WHEN landed_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
        SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) AS converted
      FROM mcp_attributions
    `).first<{ pre_stored: number; clicked: number; converted: number }>(),
    db.prepare(`
      SELECT tool_name,
        COUNT(*) AS pre_stored,
        SUM(CASE WHEN landed_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
        SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) AS converted
      FROM mcp_attributions
      GROUP BY tool_name ORDER BY clicked DESC
    `).all<{ tool_name: string; pre_stored: number; clicked: number; converted: number }>(),
    db.prepare(`
      SELECT call_id, tool_name, landed_at, conversion_type, created_at
      FROM mcp_attributions
      WHERE landed_at IS NOT NULL
      ORDER BY landed_at DESC LIMIT 20
    `).all<{ call_id: string; tool_name: string; landed_at: string; conversion_type: string | null; created_at: string }>(),
  ]);

  return c.json({
    totals,
    by_tool: byTool.results,
    recent_clicks: recent.results,
  });
});

// ---- Corpus deletion (by document fingerprint) ----------------------------
router.delete("/corpus/:fingerprint", async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: "Forbidden" }, 403);

  const fingerprint = c.req.param("fingerprint");
  if (!fingerprint || fingerprint.length !== 64) {
    return c.json({ error: "Invalid fingerprint" }, 400);
  }

  const result = await c.env.DB.prepare(
    "DELETE FROM bid_submissions WHERE document_fingerprint = ?"
  )
    .bind(fingerprint)
    .run();

  return c.json({ deleted: result.meta?.changes ?? 0 });
});

export default router;
