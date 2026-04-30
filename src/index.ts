// Provider
export { Space, CloudSignalSpace } from './context/SpaceProvider'

// Hooks
export { useSpace } from './hooks/useSpace'
export { usePresence } from './hooks/usePresence'
export { useCursors } from './hooks/useCursors'
export { useLock } from './hooks/useLock'
export { useTypingIndicator } from './hooks/useTypingIndicator'
export { useReactions } from './hooks/useReactions'
export { useBroadcast } from './hooks/useBroadcast'
export { useSharedState } from './hooks/useSharedState'

// Components
export { AvatarStack } from './components/AvatarStack'
export { CursorOverlay } from './components/CursorOverlay'
export { TypingIndicator } from './components/TypingIndicator'
export { LockIndicator } from './components/LockIndicator'
export { ReactionBar } from './components/ReactionBar'
export { PresenceBorder } from './components/PresenceBorder'

// Utilities
export { getColorForUser, getInitials } from './utils/colors'

// Constants
export { TOPIC_PREFIX, TOPICS, DEFAULTS, spaceTopic, spaceWildcard } from './constants'

// Types
export type {
  SpaceUser,
  SpaceConnectionConfig,
  SpaceProps,
  SpaceContextValue,
  PublishOptions,
  CursorData,
  UseCursorsOptions,
  UseCursorsReturn,
  UsePresenceReturn,
  UseLockReturn,
  UseTypingIndicatorReturn,
  Reaction,
  UseReactionsOptions,
  UseReactionsReturn,
  UseBroadcastReturn,
  UseSharedStateReturn,
  AvatarStackProps,
  CursorOverlayProps,
  TypingIndicatorProps,
  LockIndicatorProps,
  ReactionBarProps,
  PresenceBorderProps,
} from './types'

export const VERSION = '0.1.1'
