'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS } from '../constants'
import type { SpaceUser, UseLockReturn } from '../types'

/**
 * Component locking — "I'm editing this."
 *
 * Only one user can hold a lock at a time.
 * Automatically unlocks when the component unmounts.
 */
export function useLock(componentId: string): UseLockReturn {
  const { self, publish, addTopicHandler } = useSpace()

  const [lockedBy, setLockedBy] = useState<SpaceUser | null>(null)
  const lockedByRef = useRef<SpaceUser | null>(null)
  const isLockedByMeRef = useRef(false)
  const publishRef = useRef(publish)
  const selfUserIdRef = useRef(self.userId)

  useEffect(() => { publishRef.current = publish }, [publish])
  useEffect(() => { selfUserIdRef.current = self.userId }, [self.userId])

  const isLocked = lockedBy !== null
  const isLockedByMe = lockedBy?.userId === self.userId

  // Listen for lock/unlock messages
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.LOCKS, (_subtopic, payload) => {
      if (typeof payload !== 'object' || payload === null) return
      const data = payload as Record<string, unknown>
      if (data.componentId !== componentId) return

      const action = data.action as string

      if (action === 'lock') {
        const user: SpaceUser = {
          userId: data.userId as string,
          name: (data.name as string) || (data.userId as string),
          color: (data.color as string) || '#3B82F6',
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        }
        lockedByRef.current = user
        isLockedByMeRef.current = user.userId === self.userId
        setLockedBy(user)
      } else if (action === 'unlock') {
        lockedByRef.current = null
        isLockedByMeRef.current = false
        setLockedBy(null)
      }
    })

    return unsubscribe
  }, [addTopicHandler, componentId, self.userId])

  const lock = useCallback(() => {
    // Can't lock if already locked by someone else
    if (lockedByRef.current && lockedByRef.current.userId !== self.userId) return

    publish(TOPICS.LOCKS, {
      userId: self.userId,
      name: self.name,
      color: self.color,
      componentId,
      action: 'lock',
      ts: Date.now(),
    }, { qos: 1 })
  }, [publish, self, componentId])

  const unlock = useCallback(() => {
    if (!isLockedByMeRef.current) return

    publish(TOPICS.LOCKS, {
      userId: self.userId,
      componentId,
      action: 'unlock',
      ts: Date.now(),
    }, { qos: 1 })
  }, [publish, self.userId, componentId])

  // Auto-unlock on unmount — uses refs for fresh values
  useEffect(() => {
    return () => {
      if (isLockedByMeRef.current) {
        publishRef.current(TOPICS.LOCKS, {
          userId: selfUserIdRef.current,
          componentId,
          action: 'unlock',
          ts: Date.now(),
        }, { qos: 1 })
      }
    }
  }, [componentId])

  return { isLocked, lockedBy, isLockedByMe, lock, unlock }
}
