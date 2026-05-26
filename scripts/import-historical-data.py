#!/usr/bin/env python3
"""
Extract historical data from Mocha's d1_dump.sql and produce a clean
import file compatible with the new schema.

Usage:
    python3 scripts/import-historical-data.py > /tmp/historical_data.sql
    wrangler d1 execute remodeleriq --file /tmp/historical_data.sql

Skipped tables (stale/internal):
    - _mocha_migrations   (Mocha-internal)
    - sqlite_sequence     (SQLite-internal; auto-managed)
    - user_sessions       (all expired)
    - magic_link_tokens   (all expired)
"""

import re
import sys

DUMP_PATH = "/Applications/MAMP/htdocs/remodeleriq/www/d1_dump.sql"

# Tables to import, in dependency order (referenced tables first)
IMPORT_TABLES = [
    "user_profiles",
    "usage_tracking",
    "trusted_contractors",
    "trade_occupation_map",
    "bls_rate_cache",
    "ppi_material_cache",
    "ppi_refresh_log",
    "error_logs",
    "leads",
    "bid_analytics",
    "bid_benchmarks",
    "bls_occupational_wages",
    "zip_to_msa",
    "fred_cache",
    "fred_refresh_log",
    "verification_requests",
]

def main():
    with open(DUMP_PATH, "r") as f:
        content = f.read()

    # Split on semicolons, preserving embedded ones inside strings
    # Use a line-by-line approach: collect INSERT lines per table
    lines = content.split('\n')

    inserts_by_table = {}
    for table in IMPORT_TABLES:
        inserts_by_table[table] = []

    for line in lines:
        line = line.rstrip()
        if not line.startswith('INSERT INTO'):
            continue
        # Extract table name: INSERT INTO "tablename" ...
        m = re.match(r'INSERT INTO "([^"]+)"', line)
        if not m:
            m = re.match(r"INSERT INTO '([^']+)'", line)
        if not m:
            m = re.match(r'INSERT INTO (\w+)', line)
        if not m:
            continue
        table_name = m.group(1)
        if table_name in inserts_by_table:
            inserts_by_table[table_name].append(line)

    print("-- RemodelerIQ historical data import")
    print("-- Generated from Mocha d1_dump.sql (2026-05-18)")
    print("-- Apply AFTER migrations: wrangler d1 execute remodeleriq --file historical_data.sql")
    print()
    print("PRAGMA foreign_keys = OFF;")
    print()

    total = 0
    for table in IMPORT_TABLES:
        rows = inserts_by_table[table]
        if not rows:
            continue
        print(f"-- {table} ({len(rows)} rows)")
        for row in rows:
            print(row)
        print()
        total += len(rows)

    print("PRAGMA foreign_keys = ON;")
    print()
    print(f"-- Total: {total} rows imported across {len([t for t in IMPORT_TABLES if inserts_by_table[t]])} tables")
    sys.stderr.write(f"Extracted {total} rows\n")

if __name__ == "__main__":
    main()
