'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS, DEFAULTS } from '../constants'
import { shortId } from '../utils/uid'
import type { Reaction, UseReactionsOptions, UseReactionsReturn } from '../types'

/**
 * Emoji reactions — floating emojis that auto-expire.
 */
export function useReactions(options: UseReactionsOptions = {}): UseReactionsReturn {
  const {
    maxVisible = DEFAULTS.REACTION_MAX_VISIBLE,
    durationMs = DEFAULTS.REACTION_DURATION_MS,
  } = options

  const { self, publish, addTopicHandler } = useSpace()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const addReaction = useCallback((reaction: Reaction) => {
    // Assign a stable random x position for the float animation
    const positioned = reaction.x != null ? reaction : { ...reaction, x: Math.random() * 80 + 10 }
    setReactions(prev => {
      const next = [...prev, positioned]
      // Cap at max visible
      return next.length > maxVisible ? next.slice(-maxVisible) : next
    })

    // Auto-remove after duration
    const timer = setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id))
      timersRef.current.delete(reaction.id)
    }, durationMs)

    timersRef.current.set(reaction.id, timer)
  }, [maxVisible, durationMs])

  // Listen for reaction messages (filter out self — we add locally in sendReaction)
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.REACTIONS, (_subtopic, payload) => {
      if (typeof payload !== 'object' || payload === null) return
      const data = payload as Record<string, unknown>
      if (!data.emoji) return
      if ((data.userId as string) === self.userId) return

      addReaction({
        id: (data.id as string) || shortId(),
        userId: (data.userId as string) || '',
        name: (data.name as string) || '',
        emoji: data.emoji as string,
        color: (data.color as string) || '#3B82F6',
        ts: (data.ts as number) || Date.now(),
      })
    })

    return unsubscribe
  }, [addTopicHandler, addReaction, self.userId])

  const sendReaction = useCallback((emoji: string) => {
    const reaction: Reaction = {
      id: shortId(),
      userId: self.userId,
      name: self.name,
      emoji,
      color: self.color,
      ts: Date.now(),
    }

    publish(TOPICS.REACTIONS, reaction, { qos: 0 })

    // Also show locally
    addReaction(reaction)
  }, [publish, self, addReaction])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  return { reactions, sendReaction }
}
