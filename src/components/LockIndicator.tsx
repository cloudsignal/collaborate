'use client'

import { useLock } from '../hooks/useLock'
import type { LockIndicatorProps } from '../types'

/**
 * Shows lock status for a component and renders a colored border
 * when locked by another user.
 *
 * @example
 * <LockIndicator componentId="title-field">
 *   <input
 *     onFocus={() => lock()}
 *     onBlur={() => unlock()}
 *     disabled={isLocked && !isLockedByMe}
 *   />
 * </LockIndicator>
 *
 * Or use the hook directly for more control:
 * const { isLocked, lockedBy, lock, unlock } = useLock('title-field')
 */
export function LockIndicator({ componentId, className = '', children }: LockIndicatorProps) {
  const { isLocked, lockedBy, isLockedByMe } = useLock(componentId)

  const borderColor = isLocked
    ? isLockedByMe
      ? lockedBy?.color || '#3B82F6'
      : lockedBy?.color || '#EF4444'
    : 'transparent'

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: '6px',
        border: `2px solid ${borderColor}`,
        transition: 'border-color 200ms ease',
      }}
    >
      {children}
      {isLocked && !isLockedByMe && lockedBy && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 8,
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'white',
            backgroundColor: lockedBy.color,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {lockedBy.name}
        </div>
      )}
    </div>
  )
}
