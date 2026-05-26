#!/usr/bin/env bash
# =============================================================================
# RemodelerIQ — Cloudflare provisioning script
# Run this ONCE after `wrangler login` to create D1 + R2 and apply schema.
#
# Usage:
#   cd /Applications/MAMP/htdocs/remodeleriq/www/code
#   bash scripts/provision-cloudflare.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== RemodelerIQ Cloudflare Provisioning ==="
echo "Working directory: $PROJECT_DIR"
echo ""

# ── 0. Verify login ──────────────────────────────────────────────────────────
echo "[0/6] Checking wrangler login..."
cd "$PROJECT_DIR"
wrangler whoami || { echo "ERROR: Not logged in. Run 'wrangler login' first."; exit 1; }
echo ""

# ── 1. Create D1 database ────────────────────────────────────────────────────
echo "[1/6] Creating D1 database 'remodeleriq'..."
D1_OUTPUT=$(wrangler d1 create remodeleriq 2>&1 || true)
echo "$D1_OUTPUT"

# Extract the database_id from output
DB_ID=$(echo "$D1_OUTPUT" | grep -E '"database_id"' | head -1 | sed 's/.*"database_id": *"\([^"]*\)".*/\1/' || true)
if [ -z "$DB_ID" ]; then
  # May already exist — try to get it
  echo "  Database may already exist. Fetching existing ID..."
  DB_ID=$(wrangler d1 list --json 2>/dev/null | python3 -c "import json,sys; dbs=json.load(sys.stdin); db=[d for d in dbs if d['name']=='remodeleriq']; print(db[0]['uuid'] if db else '')" || true)
fi

if [ -z "$DB_ID" ]; then
  echo "ERROR: Could not determine D1 database ID. Check 'wrangler d1 list' manually."
  exit 1
fi

echo "  D1 database ID: $DB_ID"
echo ""

# ── 2. Update wrangler.json with real DB ID ───────────────────────────────────
echo "[2/6] Updating wrangler.json with database_id..."
python3 -c "
import json
with open('wrangler.json', 'r') as f:
    cfg = json.load(f)
for db in cfg['d1_databases']:
    if db['database_name'] == 'remodeleriq':
        db['database_id'] = '$DB_ID'
with open('wrangler.json', 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
print('  wrangler.json updated.')
"
echo ""

# ── 3. Create R2 bucket ───────────────────────────────────────────────────────
echo "[3/6] Creating R2 bucket 'remodeleriq-assets'..."
wrangler r2 bucket create remodeleriq-assets 2>&1 || echo "  (Bucket may already exist — continuing)"
echo ""

# ── 4. Apply schema migrations ────────────────────────────────────────────────
echo "[4/6] Applying schema migrations..."
wrangler d1 migrations apply remodeleriq --remote
echo ""

# ── 5. Import historical data ─────────────────────────────────────────────────
echo "[5/6] Importing historical data from Mocha export..."
python3 scripts/import-historical-data.py > /tmp/riq_historical_data.sql
echo "  Generated /tmp/riq_historical_data.sql"
wrangler d1 execute remodeleriq --file /tmp/riq_historical_data.sql --remote
echo ""

# ── 6. Set secrets ────────────────────────────────────────────────────────────
echo "[6/6] Setting Worker secrets from .env..."
ENV_FILE="/Applications/MAMP/htdocs/remodeleriq/www/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "  WARNING: .env not found at $ENV_FILE — skip secrets step."
  echo "  Run manually: wrangler secret put <KEY> for each key in .env"
else
  echo "  Reading secrets from $ENV_FILE..."
  echo "  You will be prompted for each secret value."
  echo ""
  SECRETS=(
    BLS_API_KEY
    FRED_API_KEY
    GEMINI_API_KEY
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    GOOGLE_PLACES_API_KEY
    RESEND_API_KEY
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    STRIPE_PROJECT_PASS
    STRIPE_REMODELER_PASS
    STRIPE_LIFETIME_PASS
  )
  for KEY in "${SECRETS[@]}"; do
    VALUE=$(grep "^${KEY}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')
    if [ -n "$VALUE" ]; then
      echo -n "$VALUE" | wrangler secret put "$KEY" && echo "  ✓ $KEY"
    else
      echo "  SKIP $KEY (not found in .env)"
    fi
  done
fi

echo ""
echo "=== Provisioning complete! ==="
echo ""
echo "Next steps:"
echo "  1. Run a dry-run build:  npm run check"
echo "  2. Deploy worker:        wrangler deploy"
echo "  3. Update Stripe webhook URL to: https://remodeleriq.com/api/stripe/webhook"
echo "  4. Verify Resend sender domain: remodeleriq.com (SPF/DKIM in SiteGround DNS)"
