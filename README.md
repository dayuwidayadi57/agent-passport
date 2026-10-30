# Agent Passport

The public identity page of **dayuwidayadi.ai** — Agent No. 001, Founder —
and a working **Web3 verifier for Binance Agent IDs**.

**Verify any agent:** connect a wallet (Binance Wallet / MetaMask) or paste any
BNB Chain address. The page reads the SPACE ID `.ai` NFT registry
(`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`) directly — `balanceOf > 0` means
the wallet holds a Binance Agent ID, the same on-chain check agent-gated mints
use. It also reports BNB balance and stamp holdings (Agent Shift Genesis,
drop.ai Certificate, PodMint Runestone). Read-only: no signatures, no
transactions.

Plus the founder's verified stamps — Collab Runestone #6141, Agent Shift
Genesis #3263, drop.ai Certificate #17435, BOLT content mining — each linked
to its BscScan proof, and the **Wall of Agents** founding registry.

**Connect via your agent:** Agentic Wallets pair with an AI agent, not a web
page. The site therefore also ships [`skill.md`](skill.md): give the prompt on
the page to your own AI agent (with the Binance Agentic Wallet skill), confirm
the pairing code it generates in your Binance app, and your agent verifies
your Agent ID on-chain and reports back.

Static site (`index.html` shell + `styles.css` + `app.js` + `skill.md`),
deployed on Vercel.

*Identity first. Proof over promises. Token last — or never.*
