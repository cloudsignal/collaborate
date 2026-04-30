'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCursors } from '../hooks/useCursors'
import { DEFAULTS } from '../constants'
import type { CursorOverlayProps, CursorData } from '../types'

/**
 * Drop-in cursor overlay — wraps children and renders live cursors.
 *
 * Mouse tracking and cursor rendering are handled automatically.
 * Uses imperative DOM manipulation for sub-frame performance.
 *
 * @example
 * <CursorOverlay>
 *   <div style={{ width: '100%', height: '400px' }}>
 *     Your collaborative content here
 *   </div>
 * </CursorOverlay>
 */
export function CursorOverlay({
  throttleMs,
  staleMs = DEFAULTS.CURSOR_STALE_MS,
  className = '',
  children,
}: CursorOverlayProps) {
  const { cursorsRef, onUpdateRef, publishCursor } = useCursors({ throttleMs, staleMs })

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map())

  // Imperatively sync cursor DOM nodes — no React re-renders
  const syncDOM = useCallback(() => {
    const container = containerRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    const w = container.clientWidth
    const h = container.clientHeight
    const now = Date.now()
    const cursors = cursorsRef.current

    // Remove DOM nodes for gone cursors
    for (const [id, node] of nodesRef.current) {
      if (!cursors.has(id)) {
        node.remove()
        nodesRef.current.delete(id)
      }
    }

    // Update or create DOM nodes
    for (const [id, cursor] of cursors) {
      const age = now - cursor.lastSeen
      const opacity = age > 1000
        ? Math.max(0, 1 - (age - 1000) / (staleMs - 1000))
        : 1

      let node = nodesRef.current.get(id)
      if (!node) {
        node = createCursorNode(cursor)
        wrapper.appendChild(node)
        nodesRef.current.set(id, node)
      }

      node.style.transform = `translate(${cursor.x * w}px, ${cursor.y * h}px)`
      node.style.opacity = String(opacity)
    }
  }, [cursorsRef, staleMs])

  // Register sync callback for the hook
  useEffect(() => {
    onUpdateRef.current = syncDOM
    return () => { onUpdateRef.current = null }
  }, [onUpdateRef, syncDOM])

  // Sync on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => syncDOM())
    observer.observe(container)
    return () => observer.disconnect()
  }, [syncDOM])

  // Periodic sync for opacity fade-out
  useEffect(() => {
    const interval = setInterval(syncDOM, DEFAULTS.FADE_TICK_MS)
    return () => clearInterval(interval)
  }, [syncDOM])

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    publishCursor(x, y)
  }, [publishCursor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {children}
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />
    </div>
  )
}

/** Create an SVG cursor DOM node with a name label */
function createCursorNode(cursor: CursorData): HTMLDivElement {
  const node = document.createElement('div')
  node.style.position = 'absolute'
  node.style.left = '0'
  node.style.top = '0'
  node.style.pointerEvents = 'none'
  node.style.transition = 'transform 30ms linear'
  node.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: translate(-2px, -2px)">
      <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${cursor.color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
    <div style="margin-left: 16px; margin-top: 4px; white-space: nowrap; border-radius: 4px; padding: 2px 6px; font-size: 12px; font-weight: 500; color: white; background-color: ${cursor.color}; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${escapeHtml(cursor.name)}</div>
  `
  return node
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
