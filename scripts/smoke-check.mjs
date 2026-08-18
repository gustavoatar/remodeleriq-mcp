#!/usr/bin/env node
// Post-deploy smoke check — run automatically after `npm run deploy`.
//
// Born of the Aug 2026 secrets incident: a deploy silently wiped all 24
// worker secrets and nothing surfaced it for 36 hours (auth, email, Stripe,
// and Gemini analysis were all down). Each check here fails loudly instead.
//
// Checks:
//   1. Worker API routes return JSON, not the SPA shell (run_worker_first
//      regression guard — an HTML response here means the worker was skipped)
//   2. Auth secrets present (oauth endpoint returns a redirectUrl)
//   3. Deployed version carries the expected number of secrets
//   4. Prerendered homepage is real content (not the 6-word shell)
//   5. Cost-guide pages + sitemap index serve
//
// Uses the workers.dev host for API checks to bypass the zone edge cache.

import { execSync } from "node:child_process";

const ORIGIN = "https://remodeleriq.remodeleriq.workers.dev";
const APEX = "https://remodeleriq.com";
// 23 = the restored set (Aug 17 2026). Update when secrets are legitimately
// added or removed.
const EXPECTED_SECRETS_MIN = 23;

let failures = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const fail = (name, detail) => {
  failures++;
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
};

async function get(url, opts = {}) {
  const res = await fetch(url, { redirect: "manual", ...opts });
  const text = await res.text();
  return { status: res.status, text, type: res.headers.get("content-type") || "" };
}

console.log("Post-deploy smoke check\n");

// 1+2. OAuth endpoint: JSON + secret present
{
  const r = await get(`${ORIGIN}/api/oauth/google/redirect_url`);
  if (r.text.trimStart().startsWith("<"))
    fail("API returns JSON (worker invoked)", "got HTML — check run_worker_first covers /api/*");
  else ok("API returns JSON (worker invoked)");

  if (r.status === 200 && r.text.includes("redirectUrl"))
    ok("Google OAuth configured (GOOGLE_CLIENT_ID present)");
  else fail("Google OAuth configured", `status ${r.status}: ${r.text.slice(0, 80)}`);
}

// 1b. A second, unauthenticated API route
{
  const r = await get(`${ORIGIN}/api/fred/inflation-factor`);
  if (r.status === 200 && r.type.includes("json")) ok("FRED endpoint serves JSON");
  else fail("FRED endpoint serves JSON", `status ${r.status}, type ${r.type}`);
}

// 3. Secret count on the deployed version
{
  try {
    const list = execSync("npx wrangler@latest versions list 2>/dev/null", { encoding: "utf8" });
    const ids = [...list.matchAll(/Version ID:\s+(\S+)/g)].map((m) => m[1]);
    const latest = ids[ids.length - 1];
    const view = execSync(`npx wrangler@latest versions view ${latest} 2>/dev/null`, { encoding: "utf8" });
    const count = (view.match(/Secret Name:/g) || []).length;
    if (count >= EXPECTED_SECRETS_MIN) ok(`Secrets on latest version: ${count} (>= ${EXPECTED_SECRETS_MIN})`);
    else fail("Secrets on latest version", `${count} < ${EXPECTED_SECRETS_MIN} — a deploy may have wiped them; see remodeleriq-deploy-topology memory / rollback+bulk procedure`);
  } catch (e) {
    fail("Secret count check", `wrangler error: ${String(e).slice(0, 100)}`);
  }
}

// 4. Homepage is prerendered content
{
  const r = await get(`${ORIGIN}/`);
  const links = (r.text.match(/<a\s/g) || []).length;
  if (r.text.length > 50000 && links >= 10 && /<h1/.test(r.text))
    ok(`Homepage prerendered (${Math.round(r.text.length / 1024)} KB, ${links} links, h1 present)`);
  else fail("Homepage prerendered", `${r.text.length} bytes, ${links} links — SPA shell?`);
}

// 5. Cost guides + sitemap
{
  const guide = await get(`${ORIGIN}/remodeling-cost-guides/permits/denver-co/kitchen-remodel/`);
  if (guide.status === 200 && guide.text.includes("Kitchen Remodel Permits")) ok("Permit guide serves");
  else fail("Permit guide serves", `status ${guide.status}`);

  const sm = await get(`${APEX}/sitemap.xml`);
  const children = (sm.text.match(/<loc>/g) || []).length;
  if (sm.status === 200 && children >= 7) ok(`Sitemap index serves (${children} children)`);
  else fail("Sitemap index serves", `status ${sm.status}, ${children} children`);
}

// 6. Newsletter subscribe endpoint reachable + validates (invalid email → 400 JSON)
{
  const r = await fetch(`${ORIGIN}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", source: "smoke" }),
  });
  const t = await r.text();
  if (r.status === 400 && !t.trimStart().startsWith("<")) ok("Newsletter subscribe validates (400 JSON)");
  else fail("Newsletter subscribe validates", `status ${r.status}: ${t.slice(0, 60)}`);
}

console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} CHECK(S) FAILED — investigate before walking away from this deploy.`);
process.exit(failures === 0 ? 0 : 1);
