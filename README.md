# RemodelerIQ MCP Server

Let AI agents check whether a home-remodeling contractor's bid is fair — and answer "how much should this cost?" — using RemodelerIQ's live data (BLS labor wages, Zonda Cost vs. Value benchmarks, contract-risk analysis).

**Hosted, no install.** Streamable-HTTP endpoint:

```
https://remodeleriq.com/mcp
```

## Tools

| Tool | What it does | Inputs |
|------|--------------|--------|
| **`analyze_bid`** | Scores a contractor's remodeling bid for fairness; returns a 0–100 confidence score, red flags (deposit traps, vague scope, missing items), and negotiation talk-tracks. | `bid_text` (required), `bid_total`, `state_code` |
| **`get_cost_estimate`** | 2026 market cost range for a project in a US state/city, backed by Zonda Cost vs. Value benchmarks. | `project_type`, `state_code` (required), `city_key` |
| **`get_labor_rates`** | 2026 burdened construction trade labor rates ($/hr) by US state, derived from BLS wage data. | `state_code` (required), `trade` |

## Connect

**Claude Desktop / Claude.ai** → Settings → Connectors → Add custom connector → URL: `https://remodeleriq.com/mcp`

**Cursor / other MCP clients** — add a remote (streamable-http) server pointing at the URL above.

**Test with curl:**
```bash
curl -s -X POST https://remodeleriq.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Example

> *"Is a $48,000 kitchen remodel with a 50% upfront deposit and a 'cabinets allowance TBD' line fair in Texas?"*

The agent calls `analyze_bid` → gets a low confidence score and flags: high deposit, undefined cost exposure (open allowance), missing license/permit references — plus talk-tracks to push back.

## About

Built by RemodelerIQ — a free AI bid analyzer for homeowners. https://remodeleriq.com

- Discovery: [`/.well-known/mcp/server-card.json`](https://remodeleriq.com/.well-known/mcp/server-card.json)
- Methodology: https://remodeleriq.com/how-we-score
- LLM context: https://remodeleriq.com/llms.txt

## License

MIT
