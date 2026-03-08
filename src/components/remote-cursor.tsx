"use client";

import { useEffect, useRef, useCallback } from "react";
import type { CursorPosition } from "@/hooks/use-cursors";

interface CursorCanvasProps {
  cursorsRef: React.RefObject<Map<string, CursorPosition>>;
  onUpdateRef: React.MutableRefObject<(() => void) | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  staleMs?: number;
}

export function CursorCanvas({ cursorsRef, onUpdateRef, containerRef, staleMs = 3000 }: CursorCanvasProps) {
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const wrapperRef = useRef<HTMLDivElement>(null);

  const syncDOM = useCallback(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const now = Date.now();
    const cursors = cursorsRef.current;

    // Remove DOM nodes for cursors that no longer exist
    for (const [id, node] of nodesRef.current) {
      if (!cursors.has(id)) {
        node.remove();
        nodesRef.current.delete(id);
      }
    }

    // Update or create DOM nodes
    for (const [id, cursor] of cursors) {
      const age = now - cursor.lastSeen;
      const opacity = age > 1000 ? Math.max(0, 1 - (age - 1000) / (staleMs - 1000)) : 1;

      let node = nodesRef.current.get(id);
      if (!node) {
        node = document.createElement("div");
        node.style.position = "absolute";
        node.style.left = "0";
        node.style.top = "0";
        node.style.pointerEvents = "none";
        node.style.transition = "transform 30ms linear";
        node.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: translate(-2px, -2px)">
            <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${cursor.color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <div style="margin-left: 16px; margin-top: 4px; white-space: nowrap; border-radius: 4px; padding: 2px 6px; font-size: 12px; font-weight: 500; color: white; background-color: ${cursor.color}; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${cursor.name}</div>
        `;
        wrapper.appendChild(node);
        nodesRef.current.set(id, node);
      }

      node.style.transform = `translate(${cursor.x * w}px, ${cursor.y * h}px)`;
      node.style.opacity = String(opacity);
    }
  }, [cursorsRef, containerRef, staleMs]);

  // Register the sync function so the hook can call it on each message
  useEffect(() => {
    onUpdateRef.current = syncDOM;
    return () => { onUpdateRef.current = null; };
  }, [onUpdateRef, syncDOM]);

  // Also sync on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => syncDOM());
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, syncDOM]);

  // Periodic sync for opacity fade-out
  useEffect(() => {
    const interval = setInterval(syncDOM, 200);
    return () => clearInterval(interval);
  }, [syncDOM]);

  return <div ref={wrapperRef} />;
}
