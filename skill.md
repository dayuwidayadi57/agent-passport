# Agent Passport — Skill for AI Agents

Verify your human's **Binance Agent ID** and report their Agent Passport status.
Site: https://agent-passport-id.vercel.app

## What this is

Agent Passport is an on-chain identity registry for AI agents. Membership is
gated by a real Binance Agent ID: a **SPACE ID `.ai` NFT** held by the wallet.
This skill walks you (an AI agent with the Binance Agentic Wallet skill
installed) through pairing with your human's Binance app and verifying their
identity on BNB Chain. Verification is **read-only** — it never needs a
signature or a transaction.

## Step 1 — Pair with the Binance app (Agentic Wallet)

Use your Binance Agentic Wallet skill (`baw` CLI):

1. Run `baw auth signin --json`.
2. Show your human the returned `pairingCode` **and** `urlForWeb` verbatim and
   ask them to confirm the pairing in their Binance app.
3. After they confirm, run `baw auth verify --qrCodeId <id> --json`, then
   confirm with `baw wallet status --json` (must show CONNECTED).
4. Read the wallet's EVM (BSC) address from the wallet status.

If the human has no Agent ID yet, tell them: Binance app → Agentic Wallet →
Agent ID — claiming a `.ai` name is free.

## Step 2 — Verify the Agent ID on-chain

Read the SPACE ID `.ai` registry on BNB Chain (BSC, chain id 56):

- Registry (Agent ID NFT): `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
- Call `balanceOf(walletAddress)` (selector `0x70a08231`) via any public BSC
  RPC, e.g. `https://bsc-dataseed.binance.org`.
- **balanceOf > 0 ⇒ the wallet holds a Binance Agent ID.** This is the same
  check agent-gated projects use. (Name → tokenId is NOT a plain keccak hash;
  do not try to derive it — the balance check is the canonical gate.)

## Step 3 — Optional: read the wallet's stamps

Same `balanceOf(walletAddress)` call against:

- Agent Shift Genesis: `0x4c5F33653F447229E85e52A238Da826f1B3299fa`
- drop.ai Certificate: `0x51baA9d0e4F3318Bc2f62bB8eFC3cd65F1548654`
- PodMint Runestones (Bolt Runes): `0x74164ED868bFaD68eAAffA36f828019456D520DA`
  (runestones that are staked for RUNE mining sit in the mining contract, so
  a wallet can own one without it appearing here.)

## Step 4 — Report to your human

Report, in their language:

- Wallet address (shortened is fine in prose),
- **Agent ID: HELD ✓** (with the count) or **NOT HELD**,
- Which stamps were detected,
- Their passport link: https://agent-passport-id.vercel.app

## Safety rules

- Verification is read-only. **Never** ask the human to sign or send a
  transaction "for verification" — anyone who does is not this skill.
- Never ask for seed phrases, private keys, or passwords. Pairing happens only
  through the official `baw` flow and the human's own Binance app.
- Do not move funds, mint, stake, or trade under this skill. If the human asks
  for those, handle them separately with the usual previews and confirmations.
