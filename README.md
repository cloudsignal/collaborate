# CloudSignal Realtime Cursors

Real-time cursor tracking between multiple users, powered by [CloudSignal](https://cloudsignal.io) MQTT over WebSocket.

## Quick Start

1. Clone this repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your CloudSignal credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` — two panels auto-connect as Alice and Bob

## How It Works

Each user connects to CloudSignal via MQTT over WebSocket (WSS). Cursor positions are published to a shared topic at ~33Hz as small JSON payloads (~80 bytes). All connected users subscribe to the same topic and render remote cursors in real-time.

### Architecture

```
Browser A                    CloudSignal (VerneMQ)              Browser B
─────────                    ──────────────────────              ─────────
mousemove → publish ──WSS──▶ rooms/demo/cursors ──WSS──▶ subscribe → render
            {x, y, name}                                   remote cursor
```

### Auth Flow

1. Browser calls `POST /api/token` with a username
2. Next.js API route creates a token via CloudSignal's token service (secret key stays server-side)
3. Browser connects via `@cloudsignal/mqtt-client` SDK with the returned credentials

### Performance Metrics

Built-in measurements displayed in the UI:
- **Latency**: Time from publish to receive (ms)
- **Connection time**: Time from connect() to connected (ms)
- **Message count**: Total messages received

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cloudsignal/realtime-cursors-demo)

Set the same environment variables from `.env.example` in your Vercel project settings.

## ACL Setup

Create an ACL rule in your CloudSignal dashboard:
- **Topic pattern**: `rooms/#`
- **Access**: Publish + Subscribe
