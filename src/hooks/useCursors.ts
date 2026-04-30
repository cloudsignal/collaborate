'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSpace } from './useSpace'
import { TOPICS, DEFAULTS } from '../constants'
import type { CursorData, UseCursorsOptions, UseCursorsReturn } from '../types'

/**
 * Live cursor tracking.
 *
 * Performance: Cursor data is stored in refs (not state) to avoid
 * re-renders on every MQTT message (~33 messages/sec per user).
 * The `onUpdateRef` callback lets CursorOverlay sync DOM imperatively.
 * A 1Hz state snapshot is provided for non-critical display (e.g. online count).
 */
export function useCursors(options: UseCursorsOptions = {}): UseCursorsReturn {
  const {
    throttleMs = DEFAULTS.CURSOR_THROTTLE_MS,
    staleMs = DEFAULTS.CURSOR_STALE_MS,
  } = options

  const { self, publish, addTopicHandler } = useSpace()

  // Ref-based cursor storage — zero re-renders
  const cursorsRef = useRef<Map<string, CursorData>>(new Map())
  const onUpdateRef = useRef<(() => void) | null>(null)
  const lastPublishRef = useRef(0)
  const throttleMsRef = useRef(throttleMs)

  // 1Hz state snapshot for display
  const [cursors, setCursors] = useState<CursorData[]>([])

  useEffect(() => { throttleMsRef.current = throttleMs }, [throttleMs])

  // Handle incoming cursor messages
  useEffect(() => {
    const unsubscribe = addTopicHandler(TOPICS.CURSORS, (_subtopic, payload) => {
      if (typeof payload !== 'object' || payload === null) return
      const data = payload as Record<string, unknown>
      const userId = data.userId as string
      if (!userId || userId === self.userId) return

      const now = Date.now()

      cursorsRef.current.set(userId, {
        userId,
        name: (data.name as string) || userId,
        x: (data.x as number) || 0,
        y: (data.y as number) || 0,
        color: (data.color as string) || '#3B82F6',
        ts: (data.ts as number) || now,
        lastSeen: now,
      })

      // Notify CursorOverlay to update DOM directly
      onUpdateRef.current?.()
    })

    return unsubscribe
  }, [addTopicHandler, self.userId])

  // Publish own cursor position (throttled)
  const publishCursor = useCallback((x: number, y: number) => {
    const now = Date.now()
    if (now - lastPublishRef.current < throttleMsRef.current) return
    lastPublishRef.current = now

    publish(TOPICS.CURSORS, {
      userId: self.userId,
      name: self.name,
      x,
      y,
      color: self.color,
      ts: now,
    }, { qos: 0 })
  }, [publish, self.userId, self.name, self.color])

  // 1Hz tick: clean stale cursors + sync state snapshot
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, cursor] of cursorsRef.current) {
        if (now - cursor.lastSeen > staleMs) {
          cursorsRef.current.delete(id)
          changed = true
        }
      }
      if (changed) {
        onUpdateRef.current?.()
      }

      setCursors(Array.from(cursorsRef.current.values()))
    }, DEFAULTS.STATS_TICK_MS)

    return () => clearInterval(interval)
  }, [staleMs])

  return {
    cursorsRef,
    onUpdateRef,
    cursors,
    publishCursor,
  }
}
