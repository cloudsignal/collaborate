'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS, DEFAULTS } from '../constants'
import type { SpaceUser, UseTypingIndicatorReturn } from '../types'

/**
 * Typing indicator — "Alice is typing..."
 *
 * Auto-resets after 3s of inactivity. Throttled to max 1 publish per 2s.
 * Users not seen typing in 4s are cleaned from the list.
 */
export function useTypingIndicator(inputId?: string): UseTypingIndicatorReturn {
  const { self, publish, addTopicHandler } = useSpace()

  const [typingUsers, setTypingUsers] = useState<SpaceUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingMapRef = useRef(new Map<string, SpaceUser & { lastSeen: number }>())
  const lastPublishRef = useRef(0)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Listen for typing messages
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.TYPING, (_subtopic, payload) => {
      if (typeof payload !== 'object' || payload === null) return
      const data = payload as Record<string, unknown>
      const userId = data.userId as string
      if (!userId || userId === self.userId) return

      // Filter by inputId if specified
      if (inputId && data.inputId !== inputId) return

      const isCurrentlyTyping = data.isTyping as boolean

      if (isCurrentlyTyping) {
        typingMapRef.current.set(userId, {
          userId,
          name: (data.name as string) || userId,
          color: (data.color as string) || '#3B82F6',
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        })
      } else {
        typingMapRef.current.delete(userId)
      }

      setTypingUsers(Array.from(typingMapRef.current.values()))
    })

    return unsubscribe
  }, [addTopicHandler, self.userId, inputId])

  // Clean stale typing users
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [userId, user] of typingMapRef.current) {
        if (now - user.lastSeen > DEFAULTS.TYPING_STALE_MS) {
          typingMapRef.current.delete(userId)
          changed = true
        }
      }
      if (changed) {
        setTypingUsers(Array.from(typingMapRef.current.values()))
      }
    }, 2_000)

    return () => clearInterval(interval)
  }, [])

  const publishTyping = useCallback((typing: boolean) => {
    publish(TOPICS.TYPING, {
      userId: self.userId,
      name: self.name,
      color: self.color,
      inputId,
      isTyping: typing,
      ts: Date.now(),
    }, { qos: 0 })
  }, [publish, self, inputId])

  const startTyping = useCallback(() => {
    const now = Date.now()

    // Throttle publishes
    if (now - lastPublishRef.current >= DEFAULTS.TYPING_THROTTLE_MS) {
      lastPublishRef.current = now
      publishTyping(true)
    }

    setIsTyping(true)

    // Reset auto-stop timer
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    stopTimerRef.current = setTimeout(() => {
      publishTyping(false)
      setIsTyping(false)
    }, DEFAULTS.TYPING_TIMEOUT_MS)
  }, [publishTyping])

  const stopTyping = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    publishTyping(false)
    setIsTyping(false)
  }, [publishTyping])

  // Stop typing on unmount — notify other users
  const publishTypingRef = useRef(publishTyping)
  useEffect(() => { publishTypingRef.current = publishTyping }, [publishTyping])

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current)
        publishTypingRef.current(false)
      }
    }
  }, [])

  return { typingUsers, startTyping, stopTyping, isTyping }
}
