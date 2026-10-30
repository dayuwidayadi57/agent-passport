import { unseal, confirmPairing, queryPairing, walletList, extractBscAddress, balanceOf, REGISTRY, STAMP_CONTRACTS } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "Missing session token" });
    const session = unseal(token);
    if (Date.now() > session.exp + 60000) return res.status(200).json({ stage: "expired" });

    const conf = await confirmPairing(session);
    if (!conf.success) return res.status(200).json({ stage: "error", message: "Pairing was rejected or expired on Binance's side." });
    const data = conf.data || {};
    if (data.agentSessionId) session.agentSessionId = data.agentSessionId;
    const cs = data.connectionStatus;

    if (cs !== "CONNECTED") {
      return res.status(200).json({ stage: "waiting", substate: cs || "UNCONNECTED" });
    }

    /* Confirmed in the app — wait for the wallet to be ready, then read it. */
    const q = await queryPairing(session);
    const qd = (q && q.data) || {};
    if (qd.walletCreateStatus && qd.walletCreateStatus !== "CREATED") {
      return res.status(200).json({ stage: "finalizing" });
    }

    const list = await walletList(session);
    const address = extractBscAddress(list && list.data);
    if (!address) return res.status(200).json({ stage: "finalizing" });

    const agentCount = await balanceOf(REGISTRY, address);
    const stamps = [];
    for (const s of STAMP_CONTRACTS) {
      try {
        const c = await balanceOf(s.contract, address);
        stamps.push({ name: s.name, held: c > 0n, count: Number(c) });
      } catch { stamps.push({ name: s.name, held: false, count: 0 }); }
    }
    return res.status(200).json({
      stage: "connected",
      address,
      agentIdHeld: agentCount > 0n,
      agentIdCount: Number(agentCount),
      stamps,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
