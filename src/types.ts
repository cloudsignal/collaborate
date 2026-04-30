import type { ReactNode, RefObject, MutableRefObject } from 'react'

// ============================================================================
// User & Identity
// ============================================================================

/** A user present in a collaborative space */
export interface SpaceUser {
  userId: string
  name: string
  color: string
  avatar?: string
  data?: Record<string, unknown>
  joinedAt: number
  lastSeen: number
}

// ============================================================================
// Connection Configuration
// ============================================================================

/** How to connect to CloudSignal — supports credentials, token, or external IdP */
export interface SpaceConnectionConfig {
  /** WebSocket URL (e.g. wss://connect.cloudsignal.app:18885/) */
  host: string
  /** Direct credential auth */
  username?: string
  password?: string
  /** Token-based auth */
  organizationId?: string
  secretKey?: string
  /** External IdP token (Supabase, Clerk, etc.) */
  externalToken?: string
  /** Token service URL for V2 auth */
  tokenServiceUrl?: string
}

// ============================================================================
// Space Provider
// ============================================================================

export interface SpaceProps {
  /** Unique space identifier — used as MQTT topic namespace */
  id: string
  /** Connection configuration */
  connection: SpaceConnectionConfig
  /** Display name for the local user */
  userName: string
  /** Hex color for the local user (auto-assigned if omitted) */
  userColor?: string
  /** Optional avatar URL */
  userAvatar?: string
  /** Arbitrary metadata attached to the user's presence */
  userData?: Record<string, unknown>
  /** Enable debug logging */
  debug?: boolean
  /** Presence heartbeat interval in ms (default: 10000) */
  presenceHeartbeatMs?: number
  /** Time before a user is considered offline in ms (default: 30000) */
  presenceTimeoutMs?: number
  /** Connection status change callback */
  onConnectionChange?: (connected: boolean) => void
  children: ReactNode
}

// ============================================================================
// Space Context (internal)
// ============================================================================

export type TopicHandler = (subtopic: string, payload: unknown) => void

export interface SpaceContextValue {
  spaceId: string
  self: SpaceUser
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  /** Time before a user is considered offline in ms */
  presenceTimeoutMs: number
  /** Publish a message to a space topic (automatically prefixed) */
  publish: (subtopic: string, payload: unknown, options?: PublishOptions) => void
  /** Register a handler for a topic segment — returns unsubscribe function */
  addTopicHandler: (segment: string, handler: TopicHandler) => () => void
}

export interface PublishOptions {
  qos?: 0 | 1 | 2
  retain?: boolean
}

// ============================================================================
// Cursors
// ============================================================================

export interface CursorData {
  userId: string
  name: string
  x: number
  y: number
  color: string
  ts: number
  lastSeen: number
}

export interface UseCursorsOptions {
  /** Throttle publish rate in ms (default: 30 → ~33Hz) */
  throttleMs?: number
  /** Time before a cursor fades out in ms (default: 3000) */
  staleMs?: number
}

export interface UseCursorsReturn {
  /** Ref-based cursor map for imperative rendering (no re-renders) */
  cursorsRef: RefObject<Map<string, CursorData>>
  /** Callback ref — set by CursorOverlay to sync DOM on each message */
  onUpdateRef: MutableRefObject<(() => void) | null>
  /** State snapshot of cursors, updated at 1Hz for display purposes */
  cursors: CursorData[]
  /** Publish the local user's cursor position (normalized 0–1) */
  publishCursor: (x: number, y: number) => void
}

// ============================================================================
// Presence
// ============================================================================

export interface UsePresenceReturn {
  /** All users currently in the space (including self) */
  members: SpaceUser[]
  /** Number of members */
  count: number
  /** The local user */
  self: SpaceUser
  /** Register a callback for when a user joins */
  onJoin: (callback: (user: SpaceUser) => void) => () => void
  /** Register a callback for when a user leaves */
  onLeave: (callback: (user: SpaceUser) => void) => () => void
}

// ============================================================================
// Locking
// ============================================================================

export interface UseLockReturn {
  /** Whether this component is currently locked */
  isLocked: boolean
  /** The user who holds the lock (null if unlocked) */
  lockedBy: SpaceUser | null
  /** Whether the local user holds the lock */
  isLockedByMe: boolean
  /** Acquire the lock */
  lock: () => void
  /** Release the lock */
  unlock: () => void
}

// ============================================================================
// Typing Indicator
// ============================================================================

export interface UseTypingIndicatorReturn {
  /** Users currently typing */
  typingUsers: SpaceUser[]
  /** Signal that the local user started typing */
  startTyping: () => void
  /** Signal that the local user stopped typing */
  stopTyping: () => void
  /** Whether the local user is currently marked as typing */
  isTyping: boolean
}

// ============================================================================
// Reactions
// ============================================================================

export interface Reaction {
  id: string
  userId: string
  name: string
  emoji: string
  color: string
  ts: number
  /** Horizontal position for float animation (0–100), assigned on creation */
  x?: number
}

export interface UseReactionsOptions {
  /** Max visible reactions at once (default: 20) */
  maxVisible?: number
  /** How long a reaction stays visible in ms (default: 3000) */
  durationMs?: number
}

export interface UseReactionsReturn {
  /** Currently visible reactions */
  reactions: Reaction[]
  /** Send an emoji reaction */
  sendReaction: (emoji: string) => void
}

// ============================================================================
// Broadcast
// ============================================================================

export interface UseBroadcastReturn<T = unknown> {
  /** Send a broadcast message */
  broadcast: (data: T) => void
  /** Last received message */
  lastMessage: T | null
  /** Register a callback for incoming broadcasts */
  onMessage: (callback: (data: T) => void) => () => void
}

// ============================================================================
// Shared State
// ============================================================================

export type UseSharedStateReturn<T> = [
  /** Current value */
  T,
  /** Update the value (last-write-wins across clients) */
  (value: T) => void,
]

// ============================================================================
// Component Props
// ============================================================================

export interface AvatarStackProps {
  /** Max avatars before showing "+N" (default: 5) */
  max?: number
  /** Avatar size in pixels (default: 32) */
  size?: number
  className?: string
}

export interface CursorOverlayProps {
  /** Throttle publish rate in ms (default: 30) */
  throttleMs?: number
  /** Cursor stale timeout in ms (default: 3000) */
  staleMs?: number
  className?: string
  children?: ReactNode
}

export interface TypingIndicatorProps {
  /** Optional input ID to scope typing to */
  inputId?: string
  className?: string
}

export interface LockIndicatorProps {
  /** ID of the component being locked */
  componentId: string
  className?: string
  children?: ReactNode
}

export interface ReactionBarProps {
  /** Emoji options to show (default: common set) */
  emojis?: string[]
  className?: string
}

export interface PresenceBorderProps {
  /** Component ID for lock tracking */
  componentId: string
  /** Border width in pixels (default: 2) */
  borderWidth?: number
  className?: string
  children?: ReactNode
}
