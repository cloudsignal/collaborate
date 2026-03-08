# CloudSignal Realtime Cursors

Real-time cursor tracking between multiple users, powered by [CloudSignal](https://cloudsignal.io) MQTT over WebSocket.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure your credentials:
   ```bash
   cp .env.example .env.local
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` — two panels auto-connect as Alice and Bob

## Authentication

This demo uses **preconfigured MQTT users** (not token-based). Each user has credentials set via environment variables:

```bash
# CloudSignal WSS endpoint
NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL=wss://connect.cloudsignal.app:18885/

# User credentials (create in CloudSignal dashboard under MQTT Users)
# Format: username@org_short_id
NEXT_PUBLIC_ALICE_USERNAME=alice@org_your_org_short_id
NEXT_PUBLIC_ALICE_PASSWORD=your_alice_password

NEXT_PUBLIC_BOB_USERNAME=bob@org_your_org_short_id
NEXT_PUBLIC_BOB_PASSWORD=your_bob_password
```

### Adding More Users

Add env vars following the pattern `NEXT_PUBLIC_{NAME}_USERNAME` and `NEXT_PUBLIC_{NAME}_PASSWORD`, then update `src/app/page.tsx` to include the new user panel.

## How It Works

Each user connects to CloudSignal via MQTT over WebSocket (WSS). Cursor positions are published to a shared topic at ~33Hz as small JSON payloads (~80 bytes). All connected users subscribe to the same topic and render remote cursors in real-time.

### Architecture

```
Browser A                    CloudSignal (VerneMQ)              Browser B
─────────                    ──────────────────────              ─────────
mousemove → publish ──WSS──▶ rooms/demo/cursors ──WSS──▶ subscribe → render
            {x, y, name}                                   remote cursor
```

### Performance Metrics

Built-in measurements displayed in the UI:
- **Latency**: Time from publish to receive (ms)
- **Connection time**: Time from connect() to connected (ms)
- **Message count**: Total messages received

## ACL Setup

Create an ACL rule in your CloudSignal dashboard:
- **Topic pattern**: `rooms/#`
- **Access**: Publish + Subscribe

## Deploy on Railway

1. Create a new project on [Railway](https://railway.com) and connect your repo
2. Set the **Root Directory** to `collaborate-demo` (if this is inside a monorepo)
3. Add environment variables in the Railway service settings:
   - `NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL`
   - `NEXT_PUBLIC_ALICE_USERNAME`
   - `NEXT_PUBLIC_ALICE_PASSWORD`
   - `NEXT_PUBLIC_BOB_USERNAME`
   - `NEXT_PUBLIC_BOB_PASSWORD`
4. Railway auto-detects Next.js — it will run `npm run build` and `npm start`
5. Assign a public domain under **Settings > Networking > Public Networking**

> **Note**: Since credentials are in `NEXT_PUBLIC_` env vars, they are embedded in the client bundle at build time. Railway must **rebuild** the app after changing these variables — a restart alone won't pick up changes. Use the **Redeploy** button or push a new commit.
