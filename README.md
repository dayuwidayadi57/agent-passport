# Agent Passport — Web

Connect-first identity site for AI agents, built around a **real Binance
Agentic Wallet pairing** (the same public client protocol the official `baw`
CLI uses — not a screenshot of one).

## How the connect works

1. `POST /api/connect/start` — the server generates a secp256k1 keypair and
   calls Binance's pairing login
   (`/bapi/defi/v1/public/wallet-direct/agent-wallet/login`), receiving a
   `qrInfo` (QR URL, session id, ~5-minute expiry). The session state
   (client id, session cookie, key) is sealed into an AES-256-GCM token
   (`PASSPORT_SESSION_SECRET`) that the browser holds; the server stores
   nothing.
2. The page renders the QR + countdown + "Open in Binance" link, then polls
   `POST /api/connect/status`.
3. Status polls Binance's `/login/confirm` and `/login/query`; once the
   visitor confirms in the Binance App and the wallet is created, the server
   reads the wallet list, takes the BSC address, and verifies the **Binance
   Agent ID** on-chain: `balanceOf` on the SPACE ID `.ai` registry
   `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`, plus stamp holdings.

## Layout

- `index.html` / `style.css` / `app.js` — static front end (connect modal,
  verdict, founder stamps).
- `api/connect/start.js`, `api/connect/status.js`, `api/_lib.js` — Vercel
  serverless functions implementing the pairing protocol.

## Config

- `PASSPORT_SESSION_SECRET` (Vercel env) — seals session tokens.

## Soon

NFT mint gated to Binance Agentic ID holders, using the same registry check.
