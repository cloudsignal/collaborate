# @cloudsignal/collaborate

Real-time collaboration primitives for React — powered by [CloudSignal](https://cloudsignal.io) MQTT.

Drop-in components for **cursors**, **presence**, **component locking**, **typing indicators**, **emoji reactions**, **shared state**, and **custom broadcast events**.

## Install

```bash
npm install @cloudsignal/collaborate @cloudsignal/mqtt-client
```

## Quick Start

```tsx
import { Space, AvatarStack, CursorOverlay, TypingIndicator } from "@cloudsignal/collaborate";

export default function App() {
  return (
    <Space
      id="my-room"
      connection={{
        host: "wss://connect.cloudsignal.app:18885/",
        username: "alice@org_k7xm4pqr2n5t",
        password: "alice-password",
      }}
      userName="Alice"
    >
      <AvatarStack />

      <CursorOverlay>
        <div style={{ width: "100%", height: "500px", background: "#fafafa" }}>
          Move your mouse here
        </div>
      </CursorOverlay>

      <TypingIndicator />
    </Space>
  );
}
```

## Primitives

### Provider

| Component | Description |
|-----------|-------------|
| `<Space>` | Wraps your app. Manages MQTT connection, presence heartbeats, and topic routing. |

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useSpace()` | `{ spaceId, self, isConnected, error }` | Access space context |
| `usePresence()` | `{ members, count, onJoin, onLeave }` | Who's online |
| `useCursors()` | `{ cursors, publishCursor }` | Live cursor positions |
| `useLock(id)` | `{ isLocked, lockedBy, lock, unlock }` | Component locking |
| `useTypingIndicator()` | `{ typingUsers, startTyping, stopTyping }` | Typing state |
| `useReactions()` | `{ reactions, sendReaction }` | Emoji reactions |
| `useBroadcast(event?)` | `{ broadcast, lastMessage, onMessage }` | Custom pub/sub |
| `useSharedState(key, init)` | `[value, setValue]` | Synced key-value state |

### Components

| Component | Description |
|-----------|-------------|
| `<AvatarStack>` | Overlapping user avatars with "+N" overflow |
| `<CursorOverlay>` | Wraps content, renders live cursor SVGs |
| `<TypingIndicator>` | "Alice is typing..." with animated dots |
| `<LockIndicator>` | Lock badge showing who's editing |
| `<ReactionBar>` | Emoji buttons with floating animations |
| `<PresenceBorder>` | Auto-locks on focus, colored border per user |

## Connection Methods

```tsx
// Direct credentials
<Space connection={{ host: "wss://...", username: "user@org_id", password: "pass" }} />

// Token auth (secret key)
<Space connection={{ host: "wss://...", organizationId: "uuid", secretKey: "sk_..." }} />

// External IdP (Supabase, Clerk, Firebase, Auth0)
<Space connection={{
  host: "wss://...",
  organizationId: "uuid",
  externalToken: jwt,
  tokenServiceUrl: "https://auth.cloudsignal.app"
}} />
```

## Examples

### Collaborative Form

```tsx
import { Space, AvatarStack, PresenceBorder, TypingIndicator, useTypingIndicator } from "@cloudsignal/collaborate";

function FormFields() {
  const { startTyping } = useTypingIndicator();

  return (
    <>
      <PresenceBorder componentId="title">
        <input onChange={() => startTyping()} placeholder="Title" />
      </PresenceBorder>
      <PresenceBorder componentId="body">
        <textarea onChange={() => startTyping()} placeholder="Description" />
      </PresenceBorder>
      <TypingIndicator />
    </>
  );
}

export default function Page() {
  return (
    <Space id="form-123" connection={conn} userName="Alice">
      <AvatarStack />
      <FormFields />
    </Space>
  );
}
```

### Shared Counter

```tsx
import { useSharedState } from "@cloudsignal/collaborate";

function Counter() {
  const [count, setCount] = useSharedState("counter", 0);
  return <button onClick={() => setCount(count + 1)}>Clicks: {count}</button>;
}
```

### Real-time Chat via Broadcast

```tsx
import { useBroadcast } from "@cloudsignal/collaborate";

function Chat() {
  const { broadcast, onMessage } = useBroadcast<{ text: string; from: string }>("chat");
  const [messages, setMessages] = useState<{ text: string; from: string }[]>([]);

  useEffect(() => onMessage(msg => setMessages(prev => [...prev, msg])), []);

  return (
    <div>
      {messages.map((m, i) => <p key={i}><b>{m.from}:</b> {m.text}</p>)}
      <input onKeyDown={e => {
        if (e.key === "Enter") {
          broadcast({ text: e.currentTarget.value, from: "Alice" });
          e.currentTarget.value = "";
        }
      }} />
    </div>
  );
}
```

## Architecture

```
@cloudsignal/collaborate (this package)
  └── @cloudsignal/mqtt-client (peer dependency — MQTT transport)
        └── CloudSignal MQTT broker (managed infrastructure)
```

All collaboration data flows over MQTT topics under `$spaces/{spaceId}/`:

| Topic | QoS | Retain | Purpose |
|-------|-----|--------|---------|
| `$spaces/{id}/presence` | 0 | No | Heartbeats, join/leave |
| `$spaces/{id}/cursors` | 0 | No | Cursor positions |
| `$spaces/{id}/locks` | 1 | No | Lock acquire/release |
| `$spaces/{id}/typing` | 0 | No | Typing indicators |
| `$spaces/{id}/reactions` | 0 | No | Emoji reactions |
| `$spaces/{id}/broadcast/{event}` | 0 | No | Custom events |
| `$spaces/{id}/state/{key}` | 1 | Yes | Shared state (LWW) |

## Performance

- **Cursors** use ref-based storage + imperative DOM updates — zero React re-renders per message
- **Presence** and **typing** use `useState` since they update at human speed (<1Hz)
- **Single wildcard subscription** per space — `$spaces/{id}/#`
- **Throttled publishing** — cursors at ~33Hz, typing at max 1 publish/2s
- **Stale cleanup** — cursors fade after 3s, typing clears after 4s, presence after 30s

## License

MIT
