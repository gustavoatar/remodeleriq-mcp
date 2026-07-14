// Embeddable "Bid Checker" widget — lets partners (realtors, home inspectors,
// finance bloggers) drop RemodelerIQ's analyzer onto their own site with one line.
//
//   <div id="remodeleriq-bid-checker"></div>
//   <script src="https://remodeleriq.com/embed.js" async></script>
//
// Pieces (all served by the worker):
//   GET  /embed.js        → loader that injects a responsive, auto-sizing iframe
//   GET  /embed/widget    → the self-contained widget page (this file's HTML)
//   POST /api/embed/analyze → JSON analysis, reusing the shared analyzeBidResult
//
// The widget calls the analyze endpoint same-origin (iframe is on remodeleriq.com),
// renders a score card, and funnels to the full app via a "Powered by" link.

const APP = "https://remodeleriq.com";

// --- Loader: partners paste one <script> tag; this injects the iframe. ---------
export const EMBED_LOADER_JS = `(function(){
  var d=document, s=d.currentScript;
  var mount=d.getElementById('remodeleriq-bid-checker');
  if(!mount && s){ mount=d.createElement('div'); s.parentNode.insertBefore(mount, s); }
  if(!mount) return;
  var f=d.createElement('iframe');
  f.src='${APP}/embed/checker/';
  f.title='RemodelerIQ — Free Contractor Bid Checker';
  f.loading='lazy';
  f.style.width='100%';
  f.style.maxWidth='560px';
  f.style.border='0';
  f.style.height='620px';
  f.style.margin='0 auto';
  f.style.display='block';
  f.setAttribute('scrolling','no');
  mount.appendChild(f);
  window.addEventListener('message', function(ev){
    if(ev.origin!=='${APP}') return;
    if(ev.data && ev.data.riqHeight){ f.style.height=(ev.data.riqHeight)+'px'; }
  });
})();`;

// --- Widget page: self-contained UI served inside the iframe. ------------------
// Inner JS avoids backticks / ${} so it lives cleanly inside this template string.
export const EMBED_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RemodelerIQ — Free Contractor Bid Checker</title>
<style>
  :root { --g:#1F9C4C; --ink:#0f172a; --muted:#64748b; --line:#e6eaed; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { background:transparent; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:var(--ink); line-height:1.5; -webkit-font-smoothing:antialiased; }
  .wrap { max-width:560px; margin:0 auto; padding:2px; }
  .card { border:1px solid var(--line); border-radius:16px; background:#fff; padding:20px; }
  .head { display:flex; align-items:center; gap:9px; margin-bottom:4px; }
  .logo { width:22px; height:22px; flex:0 0 auto; }
  .brand { font-size:14px; font-weight:800; letter-spacing:-.01em; }
  .brand span { color:var(--g); }
  .tag { font-size:12.5px; color:var(--muted); margin-bottom:14px; }
  label { display:block; font-size:12px; font-weight:700; color:#334155; margin:12px 0 5px; }
  textarea, input { width:100%; border:1px solid #d7dde3; border-radius:10px; padding:10px 12px; font-size:14px; font-family:inherit; color:var(--ink); }
  textarea { min-height:88px; resize:vertical; }
  textarea:focus, input:focus { outline:0; border-color:var(--g); }
  .grid { display:flex; gap:10px; }
  .grid > div { flex:1; }
  .btn { width:100%; margin-top:14px; background:var(--g); color:#fff; border:0; border-radius:11px; padding:12px; font-size:14px; font-weight:700; cursor:pointer; }
  .btn:hover { background:#18813e; }
  .btn:disabled { opacity:.6; cursor:default; }
  .err { color:#dc2626; font-size:13px; margin-top:10px; }
  /* result card */
  .result { margin-top:16px; }
  .row { display:flex; align-items:center; gap:13px; }
  .score { width:56px; height:56px; border-radius:50%; color:#fff; font-size:21px; font-weight:800; display:flex; align-items:center; justify-content:center; flex:0 0 auto; font-variant-numeric:tabular-nums; }
  .verdict { font-size:17px; font-weight:800; letter-spacing:-.01em; }
  .sub { font-size:11.5px; color:var(--muted); margin-top:2px; }
  .summary { margin-top:13px; font-size:13.5px; color:#334155; }
  .lbl { margin-top:15px; font-size:10.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:#94a3b8; }
  ul { list-style:none; margin:9px 0 0; display:flex; flex-direction:column; gap:8px; }
  li { display:flex; gap:8px; font-size:13px; color:#334155; }
  li .dot { width:7px; height:7px; border-radius:50%; margin-top:5px; flex:0 0 auto; }
  li strong { color:var(--ink); font-weight:650; }
  li .fix { color:var(--muted); }
  .cta { display:block; text-align:center; margin-top:16px; background:var(--g); color:#fff; text-decoration:none; font-weight:700; font-size:13.5px; padding:11px 14px; border-radius:11px; }
  .foot { margin-top:14px; text-align:center; font-size:11px; color:#94a3b8; }
  .foot a { color:var(--muted); text-decoration:none; font-weight:600; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="head">
      <svg class="logo" viewBox="0 0 458 488" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#1F9C4C" d="M229 8 40 118v190l189 110 189-110V118L229 8Zm-24 300-70-70 26-26 44 44 96-96 26 26-122 122Z"/></svg>
      <div class="brand">Remodeler<span>IQ</span></div>
    </div>
    <div class="tag">Free check — is your contractor's bid fair?</div>

    <form id="riq-form">
      <label for="riq-bid">Paste the bid, or describe it</label>
      <textarea id="riq-bid" placeholder="e.g. Kitchen remodel: 50% deposit at signing, cabinets and granite, no permits mentioned, no payment schedule"></textarea>
      <div class="grid">
        <div>
          <label for="riq-total">Bid total ($)</label>
          <input id="riq-total" type="number" inputmode="numeric" placeholder="48000" />
        </div>
        <div>
          <label for="riq-state">State</label>
          <input id="riq-state" type="text" maxlength="2" placeholder="TX" style="text-transform:uppercase" />
        </div>
      </div>
      <button class="btn" id="riq-btn" type="submit">Check my bid</button>
      <div class="err" id="riq-err" style="display:none"></div>
    </form>

    <div class="result" id="riq-result"></div>
  </div>
  <div class="foot">Powered by <a href="${APP}/?from=embed" target="_blank" rel="noopener">RemodelerIQ</a> · backed by BLS + Zonda 2026 data</div>
</div>

<script>
(function(){
  function postHeight(){
    try { parent.postMessage({ riqHeight: document.body.scrollHeight + 8 }, '*'); } catch(e){}
  }
  function color(s){ return s>=75 ? '#1F9C4C' : s>=50 ? '#f59e0b' : '#dc2626'; }
  function esc(t){ var d=document.createElement('div'); d.textContent=(t==null?'':String(t)); return d.innerHTML; }

  var form=document.getElementById('riq-form');
  var btn=document.getElementById('riq-btn');
  var err=document.getElementById('riq-err');
  var out=document.getElementById('riq-result');

  window.addEventListener('load', postHeight);
  window.addEventListener('resize', postHeight);

  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.style.display='none';
    var bid=document.getElementById('riq-bid').value.trim();
    var totalRaw=document.getElementById('riq-total').value.trim();
    var state=document.getElementById('riq-state').value.trim().toUpperCase();
    if(!bid){ err.textContent='Paste or describe the bid first.'; err.style.display='block'; return; }
    btn.disabled=true; btn.textContent='Checking…';
    var payload={ bid_text:bid };
    if(totalRaw){ payload.bid_total=parseFloat(totalRaw); }
    if(state){ payload.state_code=state; }
    fetch('${APP}/api/embed/analyze', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    }).then(function(r){ return r.json(); }).then(function(res){
      btn.disabled=false; btn.textContent='Check another bid';
      if(!res || !res.data){ err.textContent=(res && res.error) || 'Could not analyze that. Try adding more detail.'; err.style.display='block'; postHeight(); return; }
      render(res.data); postHeight();
    }).catch(function(){
      btn.disabled=false; btn.textContent='Check my bid';
      err.textContent='Network hiccup — please try again.'; err.style.display='block'; postHeight();
    });
  });

  function render(o){
    var c=color(o.confidence_score||0);
    var flags=(o.red_flags||[]).slice(0,4);
    var h='';
    h+='<div class="row"><div class="score" style="background:'+c+'">'+Math.round(o.confidence_score||0)+'</div>';
    h+='<div><div class="verdict">'+esc(o.verdict)+'</div><div class="sub">Confidence score / 100 · RemodelerIQ</div></div></div>';
    if(o.summary){ h+='<p class="summary">'+esc(o.summary)+'</p>'; }
    if(flags.length){
      h+='<div class="lbl">Top red flags</div><ul>';
      for(var i=0;i<flags.length;i++){ var f=flags[i]||{};
        h+='<li><span class="dot" style="background:'+c+'"></span><span><strong>'+esc(f.issue)+'</strong>'+(f.fix?' <span class="fix">— '+esc(f.fix)+'</span>':'')+'</span></li>';
      }
      h+='</ul>';
    }
    h+='<a class="cta" href="${APP}/?view=upload&from=embed" target="_blank" rel="noopener">Get the full report — upload your bid</a>';
    out.innerHTML=h;
  }
})();
</script>
</body>
</html>`;
