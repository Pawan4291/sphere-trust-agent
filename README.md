# 🟠 Unicity Trust Score Agent

**An autonomous trust-scoring agent on Unicity Sphere Testnet v2.**

> **Agentic Statement:** This application is fully agentic — the watcher loop (`src/instrumentation.ts` → `src/agent/watcher.ts`) autonomously classifies and scores every wallet event with no human approval per action. It does NOT run on Astrid OS. It operates on the Unicity Sphere Testnet v2 (network id 4).

> **Zero Fake Data:** Every number shown in the UI traces back to a real DB row written by the backend agent from a real Sphere SDK call (`sphere.payments.receive()`, `transfer:incoming` events). No hardcoded scores. No seeded fake wallets. No placeholder transaction IDs.

---

## What It Does

- **Watcher agent** runs every 15 seconds via `setInterval` started at server boot (Next.js instrumentation hook)
- **Classifies** each SDK transfer event as `completed` (two-sided, on-chain certified) or `abandoned` (one-sided/failed)
- **Scores** each wallet: `score = (completed / (completed + abandoned)) × 100`
- **Serves** results through 5 UI tabs with live polling

## SDK Finding

The Sphere SDK **does not expose a global settlement feed**. Per the build prompt's fallback clause: the agent tracks a **registered set of wallets** (anyone who hits `/api/score/:nametag` or connects their wallet) and polls each via:

- `sphere.payments.receive()` — drains the agent's real mailbox for incoming transfers
- `sphere.on('transfer:incoming', ...)` — real-time push events from testnet2
- `sphere.on('transfer:confirmed', ...)` — outgoing transfer confirmations

This is confirmed behavior from the SDK docs and source. No simulation of any kind.

---

## Tech Stack

- **Frontend + Backend:** Next.js 16 (App Router), deployed as a single app
- **Database:** PostgreSQL via Drizzle ORM
- **Blockchain SDK:** `@unicitylabs/sphere-sdk` — testnet2, network id 4
- **Animations:** Framer Motion, Recharts, custom particle canvas
- **UI:** Orange + Black, glassmorphism, particle network, glow effects

## Pages

| Tab | Route | Description |
|-----|-------|-------------|
| Connect | `/` | Sphere wallet connect via `autoConnect()` popup |
| Search | `/search` | Look up any `@nametag` trust score |
| My Score | `/my-score` | Your own score + line chart of history |
| Leaderboard | `/leaderboard` | All wallets ranked, auto-refreshes every 15s |
| Agent Activity | `/activity` | Live event feed, every row has a real tx ID |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/score/:nametag` | GET | Score for a wallet (also registers for watching) |
| `/api/leaderboard` | GET | All wallets sorted by score desc |
| `/api/activity` | GET | Recent agent-processed events |
| `/api/agent/status` | GET | Agent stats |
| `/api/wallet/connect` | POST | Register a connected wallet |

## Database Schema

```sql
-- Real trade events detected from testnet2
trade_event (id, tx_id UNIQUE, wallet_a, wallet_b, outcome CHECK IN ('completed','abandoned'), detected_at)

-- Score snapshots per wallet after each event
score_history (id, wallet, score, reason_tx_id → trade_event.tx_id, recorded_at)

-- Agent activity log — proof of no fake data
activity_log (id, text, tx_id → trade_event.tx_id, created_at)

-- Wallets the agent polls
watched_wallets (id, nametag UNIQUE, direct_address, added_at)
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL

# 3. Push schema
npx drizzle-kit push

# 4. Start dev server (agent starts automatically)
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
SPHERE_NETWORK=testnet
SPHERE_API_KEY=sk_ddc3cfcc001e4a28ac3fad7407f99590
PORT=3000
```

> The `SPHERE_API_KEY` above is the **public testnet2 key** — it is documented in the SDK repo's `.env.example` and is NOT a secret.

---

## Deployment (Render + Vercel)

### Option A: Deploy as single Next.js app (recommended)

1. Push repo to GitHub (public)
2. Create Render Web Service → connect repo → build: `npm run build` → start: `npm run start`
3. Add Render Postgres free instance → set `DATABASE_URL` env var
4. Run `npx drizzle-kit push` once via Render shell to create tables
5. Set up cron-job.org to hit `/api/health` every 10 minutes (prevents Render sleep)

### Option B: Split frontend/backend

If splitting: deploy `/` (Next.js app minus agent) to Vercel, deploy agent as separate Express app to Render.

### End-to-End Test

1. Get test UCT tokens: call `sphere.payments.mintFungibleToken()` or use the `mint` intent via `autoConnect`
2. Send tokens from wallet A → wallet B on testnet2
3. Within 15–20 seconds, the Agent Activity tab should show the event with a real tx ID
4. The Leaderboard updates automatically

---

## Agentic Behavior Declaration

- **Fully autonomous:** The watcher loop starts at server boot and processes every event without human involvement
- **Not on Astrid OS:** Standard Node.js + Next.js deployment (Render/Vercel)
- **Agentic classification:** `classifier.ts` decides `completed` vs `abandoned` purely from SDK event data
- **No human approval per action:** Scoring happens in the background loop only

---

## Submission

Ready to submit at: https://developers.unicity.network/

GitHub: Public repo required per submission rules.

Built for the **Unicity Sphere Hackathon** — Interactive/Immersive web category.
