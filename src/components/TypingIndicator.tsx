'use client'

import { useTypingIndicator } from '../hooks/useTypingIndicator'
import type { TypingIndicatorProps } from '../types'

/**
 * Displays who's currently typing.
 *
 * Renders nothing if nobody is typing.
 * Automatically formats: "Alice is typing...", "Alice and Bob are typing...",
 * "3 people are typing..."
 *
 * @example
 * <TypingIndicator className="text-sm text-gray-500 h-5" />
 */
export function TypingIndicator({ inputId, className = '' }: TypingIndicatorProps) {
  const { typingUsers } = useTypingIndicator(inputId)

  if (typingUsers.length === 0) {
    return <div className={className} style={{ minHeight: '1.25rem' }} />
  }

  let text: string
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].name} is typing...`
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
  } else {
    text = `${typingUsers.length} people are typing...`
  }

  return (
    <div className={className} style={{ minHeight: '1.25rem' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <TypingDots />
        {text}
      </span>
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            opacity: 0.6,
            animation: `cs-typing-dot 1.4s infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes cs-typing-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  )
}
