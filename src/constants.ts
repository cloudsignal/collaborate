/** MQTT topic prefix for all space collaboration messages */
export const TOPIC_PREFIX = '$spaces'

/** Topic segments for each collaboration primitive */
export const TOPICS = {
  PRESENCE: 'presence',
  CURSORS: 'cursors',
  LOCKS: 'locks',
  TYPING: 'typing',
  REACTIONS: 'reactions',
  BROADCAST: 'broadcast',
  STATE: 'state',
} as const

/** Default timing constants */
export const DEFAULTS = {
  /** Presence heartbeat interval (ms) */
  PRESENCE_HEARTBEAT_MS: 10_000,
  /** Time before a user is considered offline (ms) */
  PRESENCE_TIMEOUT_MS: 30_000,
  /** Cursor publish throttle (ms) — ~33Hz */
  CURSOR_THROTTLE_MS: 30,
  /** Time before a cursor fades out (ms) */
  CURSOR_STALE_MS: 3_000,
  /** Typing indicator auto-reset (ms) */
  TYPING_TIMEOUT_MS: 3_000,
  /** Minimum interval between typing publishes (ms) */
  TYPING_THROTTLE_MS: 2_000,
  /** Time before a typing user is cleaned from the list (ms) */
  TYPING_STALE_MS: 4_000,
  /** How long a reaction stays visible (ms) */
  REACTION_DURATION_MS: 3_000,
  /** Max visible reactions at once */
  REACTION_MAX_VISIBLE: 20,
  /** Stats sync interval (ms) — for cursor count etc. */
  STATS_TICK_MS: 1_000,
  /** Opacity fade-out sync interval (ms) */
  FADE_TICK_MS: 200,
} as const

/** Build a full MQTT topic for a space */
export function spaceTopic(spaceId: string, segment: string): string {
  return `${TOPIC_PREFIX}/${spaceId}/${segment}`
}

/** Build the wildcard subscription for a space */
export function spaceWildcard(spaceId: string): string {
  return `${TOPIC_PREFIX}/${spaceId}/#`
}
