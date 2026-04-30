'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS } from '../constants'
import type { UseBroadcastReturn } from '../types'

/**
 * Generic pub/sub for custom events.
 *
 * If `event` is provided, scopes to that event name.
 * Otherwise, receives all broadcast messages.
 *
 * @example
 * // Scoped to "chat" events
 * const { broadcast, onMessage } = useBroadcast<ChatMessage>('chat')
 * broadcast({ text: 'Hello!' })
 *
 * @example
 * // All broadcast events
 * const { onMessage } = useBroadcast()
 */
export function useBroadcast<T = unknown>(event?: string): UseBroadcastReturn<T> {
  const { publish, addTopicHandler } = useSpace()

  const [lastMessage, setLastMessage] = useState<T | null>(null)
  const callbacksRef = useRef(new Set<(data: T) => void>())

  // Listen for broadcast messages
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.BROADCAST, (subtopic, payload) => {
      // If event is specified, only match that event
      // subtopic will be "broadcast/chat" or just "broadcast"
      const eventName = subtopic.includes('/') ? subtopic.split('/').slice(1).join('/') : undefined

      if (event && eventName !== event) return

      const data = payload as T
      setLastMessage(data)
      for (const cb of callbacksRef.current) {
        cb(data)
      }
    })

    return unsubscribe
  }, [addTopicHandler, event])

  const broadcast = useCallback((data: T) => {
    const subtopic = event
      ? `${TOPICS.BROADCAST}/${event}`
      : TOPICS.BROADCAST
    publish(subtopic, data, { qos: 0 })
  }, [publish, event])

  const onMessage = useCallback((callback: (data: T) => void) => {
    callbacksRef.current.add(callback)
    return () => { callbacksRef.current.delete(callback) }
  }, [])

  return { broadcast, lastMessage, onMessage }
}
