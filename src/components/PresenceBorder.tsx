'use client'

import { useLock } from '../hooks/useLock'
import type { PresenceBorderProps } from '../types'

/**
 * Wraps a component with a colored border showing who's focused on it.
 * Automatically locks/unlocks on focus/blur of child interactive elements.
 *
 * @example
 * <PresenceBorder componentId="description-field">
 *   <textarea placeholder="Description..." />
 * </PresenceBorder>
 */
export function PresenceBorder({
  componentId,
  borderWidth = 2,
  className = '',
  children,
}: PresenceBorderProps) {
  const { isLocked, lockedBy, isLockedByMe, lock, unlock } = useLock(componentId)

  const borderColor = isLocked
    ? (lockedBy?.color || '#3B82F6')
    : 'transparent'

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: '6px',
        border: `${borderWidth}px solid ${borderColor}`,
        transition: 'border-color 200ms ease',
      }}
      onFocusCapture={() => lock()}
      onBlurCapture={() => unlock()}
    >
      {children}
      {isLocked && lockedBy && (
        <div
          style={{
            position: 'absolute',
            top: -(borderWidth + 8),
            left: 8,
            padding: '0px 6px',
            borderRadius: '4px 4px 0 0',
            fontSize: '11px',
            fontWeight: 500,
            color: 'white',
            backgroundColor: lockedBy.color,
            whiteSpace: 'nowrap',
            lineHeight: '16px',
          }}
        >
          {isLockedByMe ? 'You' : lockedBy.name}
        </div>
      )}
    </div>
  )
}
