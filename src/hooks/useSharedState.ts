'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS } from '../constants'
import { lwwMerge, type LWWEntry } from '../utils/lww'
import type { UseSharedStateReturn } from '../types'

/**
 * Synced key-value state across all users in the space.
 *
 * Uses Last-Write-Wins (LWW) merge — the update with the newest
 * timestamp wins. Retained messages ensure new joiners get current state.
 *
 * @example
 * const [count, setCount] = useSharedState('counter', 0)
 * <button onClick={() => setCount(count + 1)}>Count: {count}</button>
 */
export function useSharedState<T>(key: string, initialValue: T): UseSharedStateReturn<T> {
  const { self, publish, addTopicHandler } = useSpace()

  const [value, setValue] = useState<T>(initialValue)
  const entryRef = useRef<LWWEntry<T>>({
    value: initialValue,
    ts: 0,
    userId: self.userId,
  })

  // Listen for state updates on this key
  useEffect(() => {
    const subtopic = `${TOPICS.STATE}/${key}`

    const unsubscribe = addTopicHandler(TOPICS.STATE, (incomingSubtopic, payload) => {
      // subtopic arrives as "state/myKey" — match against our key
      const incomingKey = incomingSubtopic.includes('/')
        ? incomingSubtopic.split('/').slice(1).join('/')
        : undefined

      if (incomingKey !== key) return
      if (typeof payload !== 'object' || payload === null) return

      const data = payload as Record<string, unknown>
      const incoming: LWWEntry<T> = {
        value: data.value as T,
        ts: (data.ts as number) || 0,
        userId: (data.userId as string) || '',
      }

      const merged = lwwMerge(entryRef.current, incoming)
      if (merged !== entryRef.current) {
        entryRef.current = merged
        setValue(merged.value)
      }
    })

    return unsubscribe
  }, [addTopicHandler, key])

  const update = useCallback((newValue: T) => {
    const ts = Date.now()
    const entry: LWWEntry<T> = { value: newValue, ts, userId: self.userId }

    // Update locally immediately
    entryRef.current = entry
    setValue(newValue)

    // Publish with retain so new joiners get the latest value
    publish(`${TOPICS.STATE}/${key}`, {
      value: newValue,
      ts,
      userId: self.userId,
    }, { qos: 1, retain: true })
  }, [publish, key, self.userId])

  return [value, update]
}
