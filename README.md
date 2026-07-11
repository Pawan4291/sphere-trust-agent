# 🟠 Unicity Trust Score Agent

**An autonomous trust-scoring agent on Unicity Sphere Testnet v2.**

> **Agentic Statement:** This application is fully agentic. A QStash-driven cron (`/api/cron/sync`) polls the agent's background wallet every 15 seconds with no human approval per action. Independently, each connected user's browser syncs their real trade history from the Sphere SDK on connect and every 30 seconds after. It does NOT run on Astrid OS. It operates on Unicity Sphere Testnet v2.

> **Zero Fake Data:** Every trade shown in the UI is fetched live from `sphere_getHistory()` via the real, connected Sphere SDK client — nothing is hardcoded, seeded, or simulated. If a wallet has no real trade history, the UI shows an empty/unranked state instead of a fabricated number.

---

## What It Does

- **History sync** — when a user connects their Sphere wallet, the app fetches their real, paginated transfer history (`sphere_getHistory`) and stores it. This repeats every 30 seconds while connected, so new trades appear automatically.
- **Background agent** — a QStash cron independently polls the agent's own wallet mailbox every 15 seconds and logs activity, proving the system runs without per-action human approval.
- **Scores** each wallet relative to the most active trader on record: `score = (your completed trades ÷ top trader's completed trades) × 96`. This keeps scores meaningful and comparative even as trade volume grows across all users.
- **Serves** results through 5 UI tabs, all reading only from stored real data — no page computes or invents a score on the fly.

## SDK Finding

The Sphere SDK does not expose a global settlement feed, and `sphere_getHistory` only returns completed `SENT`/`RECEIVED` transfers — there is no "abandoned trade" concept available from this data source. Scoring is therefore based on real completed trade volume, not a completed-vs-abandoned ratio.

## Tech Stack

- **Frontend + Backend:** Next.js 16 (App Router), single deployed app on Vercel
- **Database:** PostgreSQL via Drizzle ORM (Neon)
- **Blockchain SDK:** `@unicitylabs/sphere-sdk` — testnet2
- **Background jobs:** Upstash QStash (scheduled cron)
- **UI:** Framer Motion, Recharts, custom particle canvas

## Pages

| Tab | Route | Description |
|-----|-------|-------------|
| Connect | `/` | Sphere wallet connect via `autoConnect()` popup |
| Search | `/search` | Look up any `@nametag` trust score |
| My Score | `/my-score` | Your own score, real trade count, and score history chart |
| Leaderboard | `/leaderboard` | All wallets ranked by relative score |
| Agent Activity | `/activity` | Live feed of real sync events, each tied to a real trade ID |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/score/:nametag` | GET | Score and real trade data for a wallet |
| `/api/leaderboard` | GET | All wallets sorted by score desc |
| `/api/activity` | GET | Recent real sync/agent events |
| `/api/agent/status` | GET | Agent stats (watched wallets, trade events, etc.) |
| `/api/wallet/connect` | POST | Register a connected wallet |
| `/api/wallet/backfill`, `/api/wallet/sync` | POST | Store a user's real synced trade history |
| `/api/cron/sync` | POST | QStash-triggered background poll (auth via `CRON_SECRET`) |

## Database Schema

```sql
-- Real trade events, one row per real transfer, keyed to the syncing wallet
trade_event (id, tx_id UNIQUE, wallet_a, wallet_b, outcome, detected_at)

-- Score snapshots per wallet after each sync
score_history (id, wallet, score, reason_tx_id → trade_event.tx_id, recorded_at)

-- Real sync/activity log — visible proof of no fake data
activity_log (id, text, tx_id → trade_event.tx_id, created_at)

-- Wallets the agent is aware of
watched_wallets (id, nametag UNIQUE, direct_address, added_at)
```

---

## Local Development

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npx drizzle-kit push
npm run dev
```

## Environment Variables

```env
DATABASE_URL=
SPHERE_NETWORK=testnet
CRON_SECRET=            # shared secret QStash sends as a Bearer token
```

---

## Deployment (Vercel + Neon)

1. Push repo to GitHub (public)
2. Deploy to Vercel, set `DATABASE_URL` and `CRON_SECRET` env vars
3. Run `npx drizzle-kit push` once to create tables
4. Configure a QStash schedule to POST `/api/cron/sync` with `Authorization: Bearer <CRON_SECRET>`

### End-to-End Test

1. Connect a real Sphere testnet2 wallet with existing trade history
2. Within a few seconds, My Score shows your real completed trade count and relative score
3. Agent Activity shows a log line confirming the real sync, with a real trade ID
4. The Leaderboard updates to include your wallet, ranked against others

---

## Agentic Behavior Declaration

- **Fully autonomous:** QStash cron polls independently of any user request; frontend sync runs on its own 30-second timer once a wallet is connected
- **Not on Astrid OS:** Standard Next.js + Vercel deployment
- **No human approval per action:** All syncing, scoring, and logging happens automatically in the background

---

## Submission

Ready to submit at: https://developers.unicity.network/

Built for the **Unicity Sphere Hackathon** — Interactive/Immersive web category.