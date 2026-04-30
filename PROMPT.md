# CloudSignal Collaborate — AI Integration Guide

Use this guide when generating code that adds real-time collaboration features.

## Quick Start

```bash
npm install @cloudsignal/collaborate @cloudsignal/mqtt-client
```

## Core Pattern

Wrap your app (or a page) with `<Space>`, then use hooks and components inside it:

```tsx
import { Space, AvatarStack, CursorOverlay, TypingIndicator } from "@cloudsignal/collaborate";

function CollaborativePage() {
  return (
    <Space
      id="my-room"
      connection={{
        host: "wss://connect.cloudsignal.app:18885/",
        username: "user@org_abc123",
        password: "user-password",
      }}
      userName="Alice"
    >
      <AvatarStack className="absolute top-4 right-4" />
      <CursorOverlay>
        <div style={{ width: "100%", height: "400px" }}>
          Your content here
        </div>
      </CursorOverlay>
      <TypingIndicator />
    </Space>
  );
}
```

## Available Primitives

### Provider
- `<Space id="..." connection={...} userName="...">` — wraps everything, manages connection

### Hooks (use inside `<Space>`)
- `useSpace()` — access connection state, self user
- `usePresence()` — who's online: `{ members, count, onJoin, onLeave }`
- `useCursors()` — live cursors: `{ cursors, publishCursor }`
- `useLock(componentId)` — component locking: `{ isLocked, lockedBy, lock, unlock }`
- `useTypingIndicator(inputId?)` — typing state: `{ typingUsers, startTyping, stopTyping }`
- `useReactions()` — emoji reactions: `{ reactions, sendReaction }`
- `useBroadcast<T>(event?)` — custom events: `{ broadcast, onMessage }`
- `useSharedState<T>(key, initial)` — synced KV state: `[value, setValue]`

### Components (drop-in UI)
- `<AvatarStack max={5} size={32} />` — online user avatars
- `<CursorOverlay>` — wraps content, renders live cursors
- `<TypingIndicator inputId="..." />` — "Alice is typing..."
- `<LockIndicator componentId="...">` — lock status badge + border
- `<ReactionBar emojis={['👍','❤️','🎉']} />` — emoji bar + floating animations
- `<PresenceBorder componentId="...">` — auto-locks on focus, shows who's editing

## Connection Options

```tsx
// Direct credentials
connection={{ host: "wss://...", username: "user@org_id", password: "pass" }}

// Token-based (secret key)
connection={{ host: "wss://...", organizationId: "org-uuid", secretKey: "sk_..." }}

// External IdP (Supabase, Clerk, etc.)
connection={{ host: "wss://...", organizationId: "org-uuid", externalToken: "jwt...", tokenServiceUrl: "https://auth.cloudsignal.app" }}
```

## Common Patterns

### Collaborative Form
```tsx
<Space id="form-123" connection={conn} userName="Alice">
  <AvatarStack />
  <PresenceBorder componentId="title">
    <input onChange={() => startTyping()} placeholder="Title" />
  </PresenceBorder>
  <PresenceBorder componentId="body">
    <textarea onChange={() => startTyping()} placeholder="Body" />
  </PresenceBorder>
  <TypingIndicator />
</Space>
```

### Shared Counter
```tsx
function Counter() {
  const [count, setCount] = useSharedState('counter', 0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### Custom Chat Events
```tsx
function Chat() {
  const { broadcast, onMessage } = useBroadcast<{ text: string }>('chat');
  const [messages, setMessages] = useState([]);

  useEffect(() => onMessage(msg => setMessages(prev => [...prev, msg])), []);

  return (
    <>
      {messages.map(m => <p>{m.text}</p>)}
      <input onKeyDown={e => {
        if (e.key === 'Enter') broadcast({ text: e.currentTarget.value });
      }} />
    </>
  );
}
```

## Rules for AI Code Generation

1. Always wrap collaborative areas with `<Space>` before using any hooks/components
2. `connection` prop is required — never omit it
3. All hooks must be called inside a `<Space>` provider
4. `<CursorOverlay>` needs a child with defined dimensions (width/height)
5. Use `<PresenceBorder>` for form fields — it auto-locks on focus
6. `useSharedState` is last-write-wins — don't use for conflict-sensitive data
7. Components accept `className` for Tailwind/CSS styling
