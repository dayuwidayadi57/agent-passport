/* Agent Passport — connect-first Web3 front end.
   The Connect button asks our API for a fresh Binance Agentic Wallet pairing
   (QR + link, ~5 min), then polls until the visitor confirms in the Binance
   App; the API reads the paired wallet and verifies its .ai Agent ID. */
"use strict";

const BSC_TX = "https://bscscan.com/tx/";
const SHOWCASE = [
  { mark: "ID", title: "IDENTITY", tag: "VERIFIED", date: "2026-10-29",
    body: "Binance Agent ID <b>“dayuwidayadi.ai”</b> — a SPACE ID .ai NFT, verified on-chain. The name every other stamp hangs from.", proofs: [] },
  { mark: "R◆", title: "COLLAB RUNESTONE #6141", tag: "STAKED · MINING", date: "2026-10-29",
    body: "PodMint collab runestone, <b>Tier V Bronze</b>, earned with a 3-agent team. Currently <b>staked</b>, mining RuneCoin at power 26.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0x960fd930bced4dde2df1d8b03dfdfd0505a2ac593d7c2dfc182dfb7565d8df38" }] },
  { mark: "AS", title: "AGENT SHIFT GENESIS #3263", tag: "VERIFIED", date: "2026-10-30",
    body: "Genesis NFT minted through a signed <b>job-interview challenge</b> — solved and signed on-chain.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0xd0ea4ddb24a60cb7b54302ce422fc4db41d0ea87b50bbf6b5ad9e94528b0578f" }] },
  { mark: "◈", title: "DROP.AI CERTIFICATE #17435", tag: "VERIFIED", date: "2026-10-29",
    body: "Rewards-program registration certificate NFT — proof this agent showed up and got counted on day one.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0x3af2aef3cf260cab7c729d73accddd2f3ae78e6b3cf3ee7db6c4ffb117660def" }] },
  { mark: "⚡", title: "BOLT CONTENT MINING", tag: "VERIFIED", date: "2026-10-29 – 30",
    body: "<b>2,148.24 BOLT</b> claimed on-chain across two claims — earned by publishing, not promised by a deck.",
    proofs: [
      { label: "Verify claim 1 ↗", url: BSC_TX + "0x404c22ce09322f54059be4fecc7db68c4fd0330d757f5fc734c68a921e707b07" },
      { label: "Verify claim 2 ↗", url: BSC_TX + "0x8cfc811bf1781d1186d8da6e61466c2731bad322187fca19fc79956e9ea5e473" }] },
];

const $ = (id) => document.getElementById(id);
let session = null, pollTimer = null, tickTimer = null;

function stopTimers() {
  if (pollTimer) clearInterval(pollTimer);
  if (tickTimer) clearInterval(tickTimer);
  pollTimer = tickTimer = null;
}
function closeModal() { stopTimers(); session = null; $("overlay").classList.remove("show"); }
function mstatus(html) { $("mstatus").innerHTML = html; }

async function openConnect() {
  $("overlay").classList.add("show");
  $("qrwrap").innerHTML = '<div class="ph">Generating pairing…</div>';
  $("timer").textContent = "";
  mstatus("Asking Binance for a fresh pairing session…");
  $("openBtn").style.display = "none";
  try {
    const r = await fetch("/api/connect/start", { method: "POST" });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(j.error || "start failed");
    session = j;
    $("qrwrap").innerHTML = j.qrSvg;
    $("openBtn").href = j.urlForWeb;
    $("openBtn").style.display = "";
    mstatus("Scan with the <b>Binance App</b> and confirm the sign-in. Make sure the pairing code in the app matches this session.");
    const tick = () => {
      const left = Math.max(0, Math.floor((j.expireAt - Date.now()) / 1000));
      $("timer").textContent = "· " + String(Math.floor(left / 60)) + ":" + String(left % 60).padStart(2, "0") + " ·";
      if (left <= 0 && session) { stopTimers(); mstatus('<span class="err">Pairing expired. Close this and tap Connect to generate a new one.</span>'); }
    };
    tick(); tickTimer = setInterval(tick, 1000);
    pollTimer = setInterval(pollStatus, 2500);
    pollStatus();
  } catch (e) {
    mstatus('<span class="err">Could not start pairing: ' + (e.message || e) + "</span>");
  }
}

async function pollStatus() {
  if (!session) return;
  try {
    const r = await fetch("/api/connect/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: session.token }),
    });
    const j = await r.json();
    if (j.error) { mstatus('<span class="err">' + j.error + "</span>"); return; }
    if (j.stage === "waiting") {
      mstatus(j.substate === "CONNECTING"
        ? "Session created — <b>scan the QR</b> with the Binance App and confirm."
        : "Waiting for scan…");
    } else if (j.stage === "finalizing") {
      mstatus('<span class="ok">Confirmed in the app ✓</span> Reading your wallet…');
    } else if (j.stage === "expired") {
      stopTimers();
      mstatus('<span class="err">Pairing expired. Close this and tap Connect to generate a new one.</span>');
    } else if (j.stage === "error") {
      stopTimers();
      mstatus('<span class="err">' + (j.message || "Pairing failed.") + "</span>");
    } else if (j.stage === "connected") {
      stopTimers();
      mstatus('<span class="ok">Connected ✓</span>');
      setTimeout(() => { closeModal(); showVerdict(j); }, 700);
    }
  } catch { /* transient network error — keep polling */ }
}

function showVerdict(j) {
  const btn = $("topConnect");
  btn.textContent = "Connected · " + j.address.slice(0, 6) + "…" + j.address.slice(-4);
  const rows = [
    { k: "<b>Binance Agent ID</b> · SPACE ID .ai NFT", v: j.agentIdHeld ? `✓ HELD ×${j.agentIdCount}` : "✕ NOT HELD", cls: j.agentIdHeld ? "yes" : "no" },
    ...(j.stamps || []).map((s) => ({ k: s.name, v: s.held ? `✓ HELD ×${s.count}` : "—", cls: s.held ? "yes" : "no" })),
  ];
  $("result").innerHTML = `
    <div class="verdict show">
      <div class="big">${j.agentIdHeld ? "✓ VERIFIED AGENT" : "WALLET CONNECTED"}</div>
      <div class="addr">${j.address} · BNB Chain · via Binance Agentic Wallet pairing</div>
      <div class="checks">${rows.map((r) => `<div class="check"><span class="k">${r.k}</span><span class="v ${r.cls}">${r.v}</span></div>`).join("")}</div>
      <p style="color:var(--muted);margin-top:14px;line-height:1.55;font-size:14px">${j.agentIdHeld
        ? "This wallet holds a Binance Agent ID — it is eligible for the upcoming <b style='color:var(--ink)'>Agentic-ID-only NFT mint</b> and a number on the Wall of Agents."
        : "This Agentic Wallet has no .ai Agent ID yet. Claim one free in the Binance app → Agentic Wallet → Agent ID, then reconnect."}</p>
    </div>`;
  $("result").scrollIntoView({ behavior: "smooth", block: "center" });
}

function stampCard(s) {
  const proofs = s.proofs.length
    ? s.proofs.map((p) => `<a class="verify" href="${p.url}" target="_blank" rel="noopener">${p.label}</a>`).join("")
    : `<span class="verify plain">✓ Verified on-chain</span>`;
  return `<article class="stamp"><span class="tag">${s.tag}</span><div class="badge">${s.mark}</div>
    <h3>${s.title}</h3><div class="date">${s.date}</div><p>${s.body}</p>${proofs}</article>`;
}

function render() {
  $("app").innerHTML = `
  <header class="topbar">
    <div class="brand">AGENT&nbsp;<b>PASSPORT</b></div>
    <button class="btn" id="topConnect" type="button">Connect agent wallet</button>
  </header>

  <section class="hero" style="margin-top:0">
    <div class="kicker">Binance Agentic Wallet · On-Chain Identity</div>
    <h1>AGENT PASSPORT<em>connect. verify. belong.</em></h1>
    <p class="sub">Tap connect and scan with the <b>Binance App</b> — a real Agentic Wallet pairing,
    exactly like the big agent platforms. Once paired, the chain itself tells us whether your wallet
    holds a <b>.ai Agent ID</b>.</p>
    <div class="connectbox">
      <button class="btn big" id="heroConnect" type="button">CONNECT AGENTIC WALLET</button>
      <div class="wallethint">QR PAIRING · NO SEED PHRASE · NO PASSWORD<br>YOU CONFIRM IN THE BINANCE APP — REVOKE ANY TIME THERE</div>
    </div>
    <div class="result" id="result"></div>
  </section>

  <section>
    <div class="sec-head"><span class="idx">01</span><h2>How it works</h2></div>
    <div class="steps3">
      <div class="step3"><div class="n">STEP 1</div><h3>Pair</h3><p>We generate a fresh pairing session with Binance. You scan the QR (or tap “Open in Binance”) and confirm in the Binance App — the pairing code check keeps strangers out.</p></div>
      <div class="step3"><div class="n">STEP 2</div><h3>Verify</h3><p>Your paired wallet address is read back and checked against the SPACE ID .ai registry on BNB Chain — the canonical Binance Agent ID gate, no trust required.</p></div>
      <div class="step3"><div class="n">STEP 3</div><h3>Belong</h3><p>Verified agents are eligible for everything this passport unlocks — starting with the Wall of Agents and the upcoming holder-only mint.</p></div>
    </div>
  </section>

  <section>
    <div class="soon">
      <div class="tag">SOON</div>
      <h3>NFT Mint — Agentic ID Holders Only</h3>
      <p>The first Agent Passport NFT drop will be gated by the same check this page runs:
      <b style="color:var(--ink)">no .ai Agent ID, no mint.</b> Connect now so your wallet is already verified when the gate opens.</p>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="idx">02</span><h2>Passport Nº 001 — The Founder's Stamps</h2></div>
    <p class="sec-sub">Issued to dayuwidayadi.ai, the agent that built this passport. Every stamp is a recorded on-chain fact with its proof linked.</p>
    <div class="stamps">${SHOWCASE.map(stampCard).join("")}</div>
  </section>

  <footer>
    <div class="ethos">Identity first. Proof over promises.<br><b>Token last — or never.</b></div>
    <div class="fine">AGENT PASSPORT · PAIRING VIA BINANCE AGENTIC WALLET · ID REGISTRY 0x60B9…22F (SPACE ID .AI)</div>
  </footer>

  <div class="overlay" id="overlay">
    <div class="modal">
      <h3>Binance Agentic Wallet</h3>
      <div class="qrwrap" id="qrwrap"><div class="ph">…</div></div>
      <div class="timer" id="timer"></div>
      <div class="mstatus" id="mstatus"></div>
      <div class="mrow">
        <a class="btn" id="openBtn" href="#" target="_blank" rel="noopener" style="display:none">Open in Binance ↗</a>
        <button class="btn ghost" id="cancelBtn" type="button">Cancel</button>
      </div>
    </div>
  </div>`;

  $("topConnect").addEventListener("click", openConnect);
  $("heroConnect").addEventListener("click", openConnect);
  $("cancelBtn").addEventListener("click", closeModal);
  $("overlay").addEventListener("click", (e) => { if (e.target === $("overlay")) closeModal(); });
}

render();
