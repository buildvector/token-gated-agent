# Token-Gated Agent (Solana)

A minimal, audit-friendly AI agent gated by on-chain SPL token ownership.

Users connect a Solana wallet, sign a challenge, and gain access to an AI chat **only if they hold ≥1 token of a specific SPL mint**.  
No DeFi. No staking. No roles. Just clean access control.

---

## Why this exists

Teams, DAOs, and research groups often rely on:
- Discord roles
- Web2 logins
- Off-chain permission systems

These approaches **don’t prove ownership** and expand the attack surface.

This project demonstrates a simpler model:
- **Ownership is verified on-chain**
- **Access is granted off-chain**
- **No custody, no sessions, no financial logic**

---

## How it works

1. User connects a Solana wallet (Phantom)
2. User signs a secure challenge (no transactions)
3. App checks SPL token balance for a specific mint
4. If balance ≥ 1 → access granted
5. If balance = 0 → access denied

The AI agent is only available after successful ownership verification.

---

## Demo & testing note

The live app uses a **controlled demo SPL mint**.

- Token distribution and economics are intentionally **out of scope**
- Access is restricted to demonstrate real token-gating
- Screenshots / recordings show both:
  - denied state (no token)
  - granted state (token held)

This is intentional and aligned with hackathon scope.

---

## Design principles

- Non-custodial by design
- Minimal attack surface
- Verifiable ownership
- No DeFi, no staking, no pools
- Easy to audit and reason about

---

## Tech stack

- Next.js (App Router) + TypeScript
- Solana Wallet Adapter (Phantom)
- Solana web3.js (RPC balance checks)
- OpenAI API (AI agent)

---

## Roadmap (high-level)

- v1 (current): Single-mint token-gated AI agent
- v1.1: Multiple mints + configurable access rules
- v2: Token-gated AI API endpoints for teams and DAOs

No timelines. Scope-first development.

---

## Local development

```bash
npm install
npm run dev
Open http://localhost:3000


👉 Det signalerer: *“Dette er ikke vaporware”*

---

### ✔️ Environment variables
Ja, men **uden forklaring og uden security-essay**.

**Behold dette:**
```md
## Environment variables

- AUTH_SECRET
- SOLANA_RPC_URL
- OPENAI_API_KEY