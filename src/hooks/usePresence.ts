'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS } from '../constants'
import type { SpaceUser, UsePresenceReturn } from '../types'

/**
 * Track who's in the space.
 * Presence heartbeats are managed by the Space provider —
 * this hook only reads and exposes the member list.
 */
export function usePresence(): UsePresenceReturn {
  const { self, addTopicHandler, presenceTimeoutMs } = useSpace()

  const [members, setMembers] = useState<SpaceUser[]>([self])
  const membersMapRef = useRef(new Map<string, SpaceUser>())
  const joinCallbacksRef = useRef(new Set<(user: SpaceUser) => void>())
  const leaveCallbacksRef = useRef(new Set<(user: SpaceUser) => void>())

  // Initialize with self
  useEffect(() => {
    membersMapRef.current.set(self.userId, self)
    setMembers([self])
  }, [self])

  // Handle presence messages
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.PRESENCE, (_subtopic, payload) => {
      if (typeof payload !== 'object' || payload === null) return
      const data = payload as Record<string, unknown>
      const userId = data.userId as string
      if (!userId) return

      // Leave message
      if (data.type === 'leave') {
        const user = membersMapRef.current.get(userId)
        if (user) {
          membersMapRef.current.delete(userId)
          setMembers(Array.from(membersMapRef.current.values()))
          for (const cb of leaveCallbacksRef.current) cb(user)
        }
        return
      }

      // Heartbeat / join
      const isNew = !membersMapRef.current.has(userId)
      const user: SpaceUser = {
        userId,
        name: (data.name as string) || userId,
        color: (data.color as string) || '#3B82F6',
        avatar: data.avatar as string | undefined,
        data: data.data as Record<string, unknown> | undefined,
        joinedAt: isNew ? Date.now() : (membersMapRef.current.get(userId)?.joinedAt ?? Date.now()),
        lastSeen: Date.now(),
      }

      membersMapRef.current.set(userId, user)
      setMembers(Array.from(membersMapRef.current.values()))

      if (isNew) {
        for (const cb of joinCallbacksRef.current) cb(user)
      }
    })

    return unsubscribe
  }, [addTopicHandler])

  // Clean stale members
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [userId, user] of membersMapRef.current) {
        if (userId === self.userId) continue // Never remove self
        if (now - user.lastSeen > presenceTimeoutMs) {
          membersMapRef.current.delete(userId)
          changed = true
          for (const cb of leaveCallbacksRef.current) cb(user)
        }
      }
      if (changed) {
        setMembers(Array.from(membersMapRef.current.values()))
      }
    }, 5_000)

    return () => clearInterval(interval)
  }, [self.userId, presenceTimeoutMs])

  const onJoin = useCallback((callback: (user: SpaceUser) => void) => {
    joinCallbacksRef.current.add(callback)
    return () => { joinCallbacksRef.current.delete(callback) }
  }, [])

  const onLeave = useCallback((callback: (user: SpaceUser) => void) => {
    leaveCallbacksRef.current.add(callback)
    return () => { leaveCallbacksRef.current.delete(callback) }
  }, [])

  return {
    members,
    count: members.length,
    self,
    onJoin,
    onLeave,
  }
}
