import QRCode from "qrcode";
import { startPairing, seal } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const p = await startPairing();
    const token = seal(p.session);
    const qrSvg = await QRCode.toString(p.qrCodeUrl, {
      type: "svg", margin: 1, width: 264,
      color: { dark: "#111111", light: "#ffffff" },
    });
    return res.status(200).json({
      token, qrSvg, qrCodeUrl: p.qrCodeUrl, urlForWeb: p.urlForWeb, expireAt: p.expireAt,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
