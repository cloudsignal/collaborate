'use client'

import { useReactions } from '../hooks/useReactions'
import type { ReactionBarProps } from '../types'

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '🚀', '💯']

/**
 * Emoji reaction bar with floating animations.
 *
 * Renders a row of emoji buttons + floating reactions from all users.
 *
 * @example
 * <ReactionBar emojis={['👍', '❤️', '🎉']} className="fixed bottom-4 right-4" />
 */
export function ReactionBar({ emojis = DEFAULT_EMOJIS, className = '' }: ReactionBarProps) {
  const { reactions, sendReaction } = useReactions()

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Floating reactions */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          height: 120,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {reactions.map(reaction => (
          <span
            key={reaction.id}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${reaction.x ?? 50}%`,
              fontSize: '24px',
              animation: 'cs-reaction-float 3s ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            {reaction.emoji}
          </span>
        ))}
      </div>

      {/* Emoji buttons */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            style={{
              padding: '4px 8px',
              fontSize: '18px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'transform 100ms ease, background-color 100ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.15)'
              e.currentTarget.style.backgroundColor = '#F3F4F6'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes cs-reaction-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-100px) scale(1.5); }
        }
      `}</style>
    </div>
  )
}
