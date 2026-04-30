'use client'

import { usePresence } from '../hooks/usePresence'
import { getInitials } from '../utils/colors'
import type { AvatarStackProps } from '../types'

/**
 * Shows who's online — overlapping avatars with a "+N" overflow badge.
 *
 * @example
 * <AvatarStack max={4} size={36} className="absolute top-4 right-4" />
 */
export function AvatarStack({ max = 5, size = 32, className = '' }: AvatarStackProps) {
  const { members } = usePresence()

  const visible = members.slice(0, max)
  const overflow = members.length - max

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {overflow > 0 && (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: '#6B7280',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.35,
              fontWeight: 600,
              border: '2px solid white',
              marginLeft: -size * 0.25,
              position: 'relative',
              zIndex: 0,
            }}
          >
            +{overflow}
          </div>
        )}
        {visible.map((user, i) => (
          <div
            key={user.userId}
            title={user.name}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: user.color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.35,
              fontWeight: 600,
              border: '2px solid white',
              marginLeft: i === visible.length - 1 ? 0 : -size * 0.25,
              position: 'relative',
              zIndex: visible.length - i,
              overflow: 'hidden',
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user.name)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
