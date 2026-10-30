/* Agent Passport — Binance Agentic Wallet pairing protocol (server side).
   Implements the same public client protocol as the official `baw` CLI:
   keypair (secp256k1) -> POST .../agent-wallet/login -> qrInfo + session cookie
   -> poll .../login/confirm -> GET .../login/query -> mpc-wallet/list.
   Session state travels in an AES-256-GCM encrypted token held by the browser;
   the server itself stores nothing. */
import crypto from "node:crypto";

const BAPI = "https://www.binance.com/bapi/defi/v1/public/wallet-direct/agent-wallet";
export const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID .ai — Binance Agent ID NFT
export const STAMP_CONTRACTS = [
  { name: "Agent Shift Genesis NFT", contract: "0x4c5F33653F447229E85e52A238Da826f1B3299fa" },
  { name: "drop.ai Certificate NFT", contract: "0x51baA9d0e4F3318Bc2f62bB8eFC3cd65F1548654" },
  { name: "PodMint Runestone", contract: "0x74164ED868bFaD68eAAffA36f828019456D520DA" },
];
const BSC_RPCS = ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"];

/* ---------- session token (stateless custody) ---------- */
function key() {
  const s = process.env.PASSPORT_SESSION_SECRET;
  if (!s) throw new Error("PASSPORT_SESSION_SECRET is not set");
  return crypto.createHash("sha256").update(s).digest();
}
export function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}
export function unseal(token) {
  const buf = Buffer.from(token, "base64url");
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), enc = buf.subarray(28);
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
}

/* ---------- Binance pairing client ---------- */
export function clientHeaders(clientId, cookie) {
  const h = {
    "Content-Type": "application/json",
    agentClientId: clientId,
    agentClientSystem: "Linux",
    agentClientMac: "00:00:00:00:00:00",
    "bnc-uuid": clientId,
    "x-trace-id": crypto.randomUUID(),
    device_name: "agent-passport-web",
    system_lang: "en-US",
    timezone: "Asia/Jakarta",
    system_version: "Linux",
    version_code: "1.12.0",
    clientVersion: "1.12.0",
    agentClientType: "AGENT_CLI",
    agentClientVersion: "1.12.0",
    "User-Agent": "agent-passport/1.0",
  };
  if (cookie) h.Cookie = cookie;
  return h;
}

export async function startPairing() {
  const ecdh = crypto.createECDH("secp256k1");
  ecdh.generateKeys();
  const pubHex = ecdh.getPublicKey("hex", "compressed");
  const clientId = crypto.randomUUID();
  const r = await fetch(`${BAPI}/login`, {
    method: "POST",
    headers: clientHeaders(clientId),
    body: JSON.stringify({ isFirstLogin: true, os: "Linux", publicKeyHex: pubHex.substring(2) }),
  });
  const setCookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  const cookie = (setCookies[0] || r.headers.get("set-cookie") || "").split(";")[0] || "";
  const j = await r.json();
  if (!j.success || !j.data || !j.data.qrInfo) throw new Error("Binance login failed: " + JSON.stringify(j).slice(0, 200));
  const { qrCodeUrl, qrCodeId, expireAt } = j.data.qrInfo;
  return {
    session: { clientId, qrCodeId, cookie, privHex: ecdh.getPrivateKey("hex"), exp: Number(expireAt) },
    qrCodeUrl,
    qrCodeId,
    expireAt: Number(expireAt),
    urlForWeb: `https://web3.binance.com/en/agent-login?expireAt=${expireAt}&url=${encodeURIComponent(qrCodeUrl)}`,
  };
}

async function bapi(session, path, method, body) {
  const cookie = session.agentSessionId ? `agentSessionId=${session.agentSessionId}` : session.cookie;
  const r = await fetch(`${BAPI}${path}`, {
    method,
    headers: clientHeaders(session.clientId, cookie),
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}
export const confirmPairing = (s) => bapi(s, "/login/confirm", "POST", { qrCodeId: s.qrCodeId });
export const queryPairing = (s) => bapi(s, "/login/query", "GET");
export const walletList = (s) => bapi(s, "/mpc-wallet/list", "POST", {});

/* Find the BSC (chainId 56) EVM address in an mpc-wallet/list payload. */
export function extractBscAddress(payload) {
  let best = null, firstEvm = null;
  const visit = (node, ctx) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n) => visit(n, ctx));
    const tag = JSON.stringify({ c: node.chainId ?? node.chain ?? node.network ?? node.chainName ?? "" });
    const isBsc = /56|bsc|bnb/i.test(tag);
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v) && /addr/i.test(k)) {
        if (!firstEvm) firstEvm = v;
        if (isBsc && !best) best = v;
      }
      if (v && typeof v === "object") visit(v, ctx);
    }
  };
  visit(payload, null);
  return best || firstEvm;
}

/* ---------- BSC reads for the verdict ---------- */
export async function bscCall(to, data) {
  for (const url of BSC_RPCS) {
    try {
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
      });
      const j = await r.json();
      if (j.result) return j.result;
    } catch { /* try next rpc */ }
  }
  throw new Error("BSC RPC failed");
}
export async function balanceOf(contract, addr) {
  const res = await bscCall(contract, "0x70a08231" + addr.toLowerCase().replace(/^0x/, "").padStart(64, "0"));
  return BigInt(res);
}
