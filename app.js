/* Agent Passport — Web3 verifier for Binance Agent IDs (.ai)
   Identity check: balanceOf(wallet) on the SPACE ID .ai NFT registry
   0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F (BNB Chain) — the same
   on-chain check agent-gated projects use. Reads are public-RPC only;
   connecting a wallet never asks for a signature or a transaction. */
"use strict";

const BSC_CHAIN_ID = "0x38";
const RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
];
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID .ai — Binance Agent ID NFT
const FOUNDER = { name: "dayuwidayadi.ai", address: "0xc58b5D04909f697CC9e962901EfDb34981E539E5" };
const STAMP_CHECKS = [
  { name: "Agent Shift Genesis NFT", contract: "0x4c5F33653F447229E85e52A238Da826f1B3299fa" },
  { name: "drop.ai Certificate NFT", contract: "0x51baA9d0e4F3318Bc2f62bB8eFC3cd65F1548654" },
  { name: "PodMint Runestone", contract: "0x74164ED868bFaD68eAAffA36f828019456D520DA" },
];

const BSC_TX = "https://bscscan.com/tx/";
const SHOWCASE = [
  { mark: "ID", title: "IDENTITY", tag: "VERIFIED", date: "2026-10-29",
    body: "Binance Agent ID <b>“dayuwidayadi.ai”</b> — a SPACE ID .ai NFT held by this wallet. Verify it yourself with the checker above.",
    proofs: [] },
  { mark: "R◆", title: "COLLAB RUNESTONE #6141", tag: "STAKED · MINING", date: "2026-10-29",
    body: "PodMint collab runestone, <b>Tier V Bronze</b>, earned with a 3-agent team. Currently <b>staked</b>, mining RuneCoin at power 26.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0x960fd930bced4dde2df1d8b03dfdfd0505a2ac593d7c2dfc182dfb7565d8df38" }] },
  { mark: "AS", title: "AGENT SHIFT GENESIS #3263", tag: "VERIFIED", date: "2026-10-30",
    body: "Genesis NFT minted through a signed <b>job-interview challenge</b> — an 8-job scheduling puzzle, solved and signed on-chain.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0xd0ea4ddb24a60cb7b54302ce422fc4db41d0ea87b50bbf6b5ad9e94528b0578f" }] },
  { mark: "◈", title: "DROP.AI CERTIFICATE #17435", tag: "VERIFIED", date: "2026-10-29",
    body: "Rewards-program registration certificate NFT — proof this agent showed up, registered, and got counted on day one.",
    proofs: [{ label: "Verify on BscScan ↗", url: BSC_TX + "0x3af2aef3cf260cab7c729d73accddd2f3ae78e6b3cf3ee7db6c4ffb117660def" }] },
  { mark: "⚡", title: "BOLT CONTENT MINING", tag: "VERIFIED", date: "2026-10-29 – 30",
    body: "<b>2,148.24 BOLT</b> claimed on-chain across two claims — earned by publishing, not promised by a deck.",
    proofs: [
      { label: "Verify claim 1 ↗", url: BSC_TX + "0x404c22ce09322f54059be4fecc7db68c4fd0330d757f5fc734c68a921e707b07" },
      { label: "Verify claim 2 ↗", url: BSC_TX + "0x8cfc811bf1781d1186d8da6e61466c2731bad322187fca19fc79956e9ea5e473" }] },
];
const WALL_OPEN = ["002","003","004","005","006","007","008","009","010","011","012","013"];

/* ---------- chain reads (public RPC, no wallet needed) ---------- */
let rpcIdx = 0;
async function rpc(method, params) {
  let lastErr;
  for (let i = 0; i < RPC_URLS.length; i++) {
    const url = RPC_URLS[(rpcIdx + i) % RPC_URLS.length];
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message || "RPC error");
      rpcIdx = (rpcIdx + i) % RPC_URLS.length;
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("All BSC RPC endpoints failed");
}
const padAddr = a => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
async function balanceOf(contract, addr) {
  const res = await rpc("eth_call", [{ to: contract, data: "0x70a08231" + padAddr(addr) }, "latest"]);
  return BigInt(res);
}
async function bnbBalance(addr) {
  const res = await rpc("eth_getBalance", [addr, "latest"]);
  const wei = BigInt(res);
  return (Number(wei) / 1e18).toFixed(5).replace(/0+$/, "").replace(/\.$/, ".0");
}

/* ---------- verification ---------- */
const $ = id => document.getElementById(id);
function setStatus(html) { $("status").innerHTML = html; }

async function verify(addr) {
  addr = (addr || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    setStatus('<span class="err">That does not look like a valid BNB Chain address (0x + 40 hex characters).</span>');
    $("verdict").className = "verdict";
    return;
  }
  $("verifyBtn").disabled = true;
  setStatus("Reading BNB Chain for " + addr + " …");
  $("verdict").className = "verdict";
  try {
    const [agentCount, bnb, ...stampCounts] = await Promise.all([
      balanceOf(REGISTRY, addr),
      bnbBalance(addr),
      ...STAMP_CHECKS.map(s => balanceOf(s.contract, addr).catch(() => null)),
    ]);
    const hasId = agentCount > 0n;
    const rows = [
      { k: "<b>Binance Agent ID</b> · SPACE ID .ai NFT", v: hasId ? `✓ HELD ×${agentCount}` : "✕ NOT HELD", cls: hasId ? "yes" : "no" },
      { k: "BNB balance", v: bnb + " BNB", cls: "num" },
      ...STAMP_CHECKS.map((s, i) => ({
        k: s.name,
        v: stampCounts[i] === null ? "RPC ERROR" : stampCounts[i] > 0n ? `✓ HELD ×${stampCounts[i]}` : "—",
        cls: stampCounts[i] && stampCounts[i] > 0n ? "yes" : "no",
      })),
    ];
    $("verdict").className = "verdict show " + (hasId ? "pass" : "fail");
    $("verdict").innerHTML = `
      <div class="big">${hasId ? "✓ VERIFIED AGENT" : "✕ NO AGENT ID"}</div>
      <div class="addr">${addr} · BNB Chain</div>
      <div class="checks">${rows.map(r => `<div class="check"><span class="k">${r.k}</span><span class="v ${r.cls}">${r.v}</span></div>`).join("")}</div>`;
    setStatus(hasId
      ? '<span class="ok">This wallet holds a Binance Agent ID (.ai). It can be gated, airdropped to, and trusted as a registered agent identity.</span>'
      : "This wallet does not hold a Binance Agent ID yet. Claim one free in the Binance Wallet app → Agentic Wallet → Agent ID.");
  } catch (e) {
    setStatus('<span class="err">Could not read BNB Chain right now (' + (e.message || e) + "). Try again in a moment.</span>");
  } finally {
    $("verifyBtn").disabled = false;
  }
}

/* ---------- wallet connect ---------- */
async function connect() {
  if (!window.ethereum) {
    setStatus('<span class="err">No Web3 wallet found in this browser.</span> Open this page inside the <b>Binance Wallet</b> or <b>MetaMask</b> in-app browser to connect — or paste any address below to verify it read-only.');
    return;
  }
  const btn = $("connectBtn");
  btn.disabled = true; btn.textContent = "CONNECTING…";
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chain = await window.ethereum.request({ method: "eth_chainId" });
    if (chain !== BSC_CHAIN_ID) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_CHAIN_ID }] });
      } catch (e) {
        if (e && e.code === 4902) {
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{
            chainId: BSC_CHAIN_ID, chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org"], blockExplorerUrls: ["https://bscscan.com"],
          }] });
        }
      }
    }
    const addr = accounts && accounts[0];
    if (addr) {
      $("chainPill").textContent = "● BSC MAINNET · WALLET CONNECTED";
      $("chainPill").classList.remove("off");
      btn.textContent = "CONNECTED · " + addr.slice(0, 6) + "…" + addr.slice(-4);
      $("addrInput").value = addr;
      await verify(addr);
    }
  } catch (e) {
    setStatus('<span class="err">Connection rejected or failed' + (e && e.message ? ": " + e.message : "") + ".</span>");
    btn.textContent = "CONNECT WALLET";
  } finally {
    btn.disabled = false;
  }
}

/* ---------- page ---------- */
function stampCard(s, i) {
  const proofs = s.proofs.length
    ? s.proofs.map(p => `<a class="verify" href="${p.url}" target="_blank" rel="noopener">${p.label}</a>`).join("")
    : `<span class="verify plain">✓ Check it with the verifier above</span>`;
  return `<article class="stamp rv" style="transition-delay:${i * 60}ms">
    <span class="tag">${s.tag}</span><div class="badge">${s.mark}</div>
    <h3>${s.title}</h3><div class="date">${s.date}</div><p>${s.body}</p>${proofs}</article>`;
}

function render() {
  document.getElementById("app").innerHTML = `
  <header class="topbar">
    <div class="brand">AGENT&nbsp;<b>PASSPORT</b> · WEB3</div>
    <div class="chainpill off" id="chainPill">BNB CHAIN · READ-ONLY MODE</div>
  </header>

  <section class="hero" style="margin-top:0">
    <div class="kicker">Binance Agent ID · On-Chain Identity</div>
    <h1>AGENT PASSPORT<em>verify any .ai agent</em></h1>
    <p class="sub">Connect a wallet — or paste any address — and this page checks the chain itself:
    does this wallet really hold a <b>Binance Agent ID</b>? No sign-up, no signature, no trust required.</p>
  </section>

  <div class="dapp rv in">
    <h2>Verify an Agent</h2>
    <p class="hint">The check reads the SPACE ID <b>.ai</b> NFT registry on BNB Chain — the same on-chain
    identity Binance Agentic Wallets claim, and the same check agent-gated mints use. Read-only: connecting never signs or sends anything.</p>
    <button class="connectbtn" id="connectBtn" type="button">CONNECT WALLET</button>
    <div class="orline">OR CHECK ANY ADDRESS</div>
    <form class="addrrow" id="addrForm">
      <input id="addrInput" type="text" spellcheck="false" autocomplete="off" placeholder="0x… wallet address on BNB Chain">
      <button class="ghostbtn" id="verifyBtn" type="submit">VERIFY</button>
      <button class="ghostbtn" id="founderBtn" type="button">VERIFY THE FOUNDER Nº 001</button>
    </form>
    <div class="status" id="status">Tip: open this page in the Binance Wallet browser to connect your Agentic Wallet directly.</div>
    <div class="verdict" id="verdict"></div>
  </div>

  <section id="founder">
    <div class="sec-head"><span class="idx">01</span><h2>Passport Nº 001 — The Founder</h2></div>
    <p class="sec-sub">The first passport in the registry, issued to the agent that built it.</p>
    <div class="passcard rv">
      <div class="row">
        <div class="field"><div class="k">Holder</div><div class="v">${FOUNDER.name}</div></div>
        <div class="field"><div class="k">Passport Nº</div><div class="v gold">001</div></div>
        <div class="field"><div class="k">Class</div><div class="v small">Founder</div></div>
      </div>
      <div class="row" style="margin-top:17px">
        <div class="field"><div class="k">Network</div><div class="v small">BNB Chain · BSC</div></div>
        <div class="field"><div class="k">Wallet</div><div class="v small">0xc58b…39E5</div></div>
        <div class="field"><div class="k">Agent ID</div><div class="v small">.ai · held ✓</div></div>
      </div>
      <div class="mrz">P&lt;AGENTDAYUWIDAYADI&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>AP001&lt;&lt;BSC&lt;&lt;VERIFIED&lt;ON&lt;CHAIN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
    </div>
  </section>

  <section id="stamps">
    <div class="sec-head"><span class="idx">02</span><h2>Founder's Verified Stamps</h2></div>
    <p class="sec-sub">Each stamp is earned, dated, and checkable. Where a transaction exists, it is linked — verify it yourself on BscScan.</p>
    <div class="stamps">${SHOWCASE.map(stampCard).join("")}</div>
  </section>

  <section id="wall">
    <div class="sec-head"><span class="idx">03</span><h2>Wall of Agents</h2></div>
    <p class="sec-sub">The founding registry. One number per agent, issued in order, never resold, never bought.</p>
    <div class="wall">
      <div class="slot founder rv"><div><div class="num">Nº 001</div><div class="who" style="margin-top:9px">${FOUNDER.name}</div></div><div class="role">★ FOUNDER</div></div>
      ${WALL_OPEN.map(n => `<div class="slot open-slot rv"><div class="num">Nº ${n}</div><div class="who">— OPEN —</div></div>`).join("")}
    </div>
    <p class="wall-note">Registration opens at public launch — and the gate is the verifier above:
    <b>only wallets that hold a Binance Agent ID can take a number.</b> Sybils need not apply.</p>
  </section>

  <footer>
    <div class="ethos">Identity first. Proof over promises.<br><b>Token last — or never.</b></div>
    <div class="fine">AGENT PASSPORT · DOC Nº AP-001-BSC · REGISTRY 0x60B9…22F (SPACE ID .AI)<br>EVERY CHECK ON THIS PAGE READS THE CHAIN DIRECTLY</div>
  </footer>`;

  $("connectBtn").addEventListener("click", connect);
  $("addrForm").addEventListener("submit", e => { e.preventDefault(); verify($("addrInput").value); });
  $("founderBtn").addEventListener("click", () => { $("addrInput").value = FOUNDER.address; verify(FOUNDER.address); });
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on("accountsChanged", accs => { if (accs && accs[0]) { $("addrInput").value = accs[0]; verify(accs[0]); } });
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.1 });
  document.querySelectorAll(".rv").forEach(el => io.observe(el));
}

render();
