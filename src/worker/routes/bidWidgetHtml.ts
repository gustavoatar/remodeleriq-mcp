// ChatGPT App (Apps SDK) widget for the analyze_bid tool. Served as an MCP
// resource (ui://widget/bid-result.html, mimeType text/html+skybridge). ChatGPT
// renders it in a sandboxed iframe and exposes the tool's structuredContent at
// window.openai.toolOutput. Self-contained: no external scripts, no template
// literals (keeps it safe inside this exported string). Brand green #1F9C4C.
export const BID_WIDGET_URI = "ui://widget/bid-result.html";

export const BID_WIDGET_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: transparent; }
  .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; max-width: 560px; background: #fff; }
  .row { display: flex; align-items: center; gap: 14px; }
  .score { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 800; flex: 0 0 auto; }
  .verdict { font-size: 18px; font-weight: 800; }
  .sub { color: #64748b; font-size: 13px; }
  .summary { margin: 14px 0 0; font-size: 14px; line-height: 1.5; color: #334155; }
  h4 { margin: 16px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
  ul { margin: 0; padding: 0; list-style: none; }
  li { display: flex; gap: 8px; font-size: 13px; margin: 7px 0; color: #334155; }
  .dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 6px; flex: 0 0 auto; }
  .cta { display: inline-block; margin-top: 16px; background: #1F9C4C; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 10px 16px; border-radius: 10px; }
  .foot { margin-top: 12px; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
<div id="root"><div class="card sub">Waiting for analysis…</div></div>
<script>
(function () {
  function color(s) { return s >= 75 ? '#1F9C4C' : s >= 50 ? '#f59e0b' : '#dc2626'; }
  function esc(t) { var d = document.createElement('div'); d.textContent = (t == null ? '' : String(t)); return d.innerHTML; }
  function render() {
    var o = (window.openai && window.openai.toolOutput) || null;
    var root = document.getElementById('root');
    if (!root) return;
    if (!o) { root.innerHTML = '<div class="card sub">Waiting for analysis…</div>'; return; }
    var score = Math.round(o.confidence_score || 0);
    var c = color(o.confidence_score || 0);
    var flags = (o.red_flags || []).slice(0, 4);
    var html = '<div class="card">';
    html += '<div class="row"><div class="score" style="background:' + c + '">' + score + '</div>';
    html += '<div><div class="verdict">' + esc(o.verdict) + '</div><div class="sub">Confidence score / 100 · RemodelerIQ</div></div></div>';
    if (o.summary) { html += '<p class="summary">' + esc(o.summary) + '</p>'; }
    if (flags.length) {
      html += '<h4>Top red flags</h4><ul>';
      for (var i = 0; i < flags.length; i++) {
        var f = flags[i] || {};
        html += '<li><span class="dot" style="background:' + c + '"></span><span><strong>' + esc(f.issue) + '</strong>' + (f.fix ? ' — ' + esc(f.fix) : '') + '</span></li>';
      }
      html += '</ul>';
    }
    html += '<a class="cta" href="https://remodeleriq.com/?view=upload&from=chatgpt" target="_blank" rel="noopener">Upload your bid for the full report →</a>';
    html += '<div class="foot">Free analysis from RemodelerIQ · backed by BLS + Zonda 2026 data</div>';
    html += '</div>';
    root.innerHTML = html;
  }
  render();
  window.addEventListener('openai:set_globals', render);
})();
</script>
</body>
</html>`;
