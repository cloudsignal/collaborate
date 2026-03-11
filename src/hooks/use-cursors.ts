"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCloudSignal } from "./use-cloudsignal";
import { getColorForUser } from "@/lib/colors";

export interface CursorPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  ts: number;
  lastSeen: number;
}

interface UseCursorsOptions {
  roomId: string;
  userName: string;
  throttleMs?: number;
  staleMs?: number;
}

export function useCursors(options: UseCursorsOptions) {
  const { roomId, userName, throttleMs = 30, staleMs = 3000 } = options;

  // Stats shown in header — updated at 1Hz, not per-message
  const [stats, setStats] = useState({ latency: null as number | null, messageCount: 0, connectionTime: null as number | null, onlineCount: 0 });
  const [userId, setUserId] = useState("");

  // All transient data lives in refs (no re-renders on cursor updates)
  const cursorsRef = useRef<Map<string, CursorPosition>>(new Map());
  const userIdRef = useRef<string>("");
  const lastPublishRef = useRef(0);
  const connectStartRef = useRef(0);
  const throttleMsRef = useRef(throttleMs);
  const latencyRef = useRef<number | null>(null);
  const messageCountRef = useRef(0);
  const onUpdateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    throttleMsRef.current = throttleMs;
  }, [throttleMs]);

  const topic = `rooms/${roomId}/cursors`;

  // Handle incoming cursor messages — ref-only, no setState
  const handleMessage = useCallback(
    (_topic: string, payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;
      const data = payload as { id?: string; name?: string; x?: number; y?: number; color?: string; ts?: number };
      if (!data.id || data.id === userIdRef.current) return;

      const now = Date.now();
      if (data.ts) {
        latencyRef.current = now - data.ts;
      }
      messageCountRef.current += 1;

      cursorsRef.current.set(data.id, {
        id: data.id,
        name: data.name || "Unknown",
        x: data.x || 0,
        y: data.y || 0,
        color: data.color || "#3B82F6",
        ts: data.ts || now,
        lastSeen: now,
      });

      // Notify renderer to update DOM directly
      onUpdateRef.current?.();
    },
    []
  );

  const { isConnected, isConnecting, error, connect, disconnect, subscribe, publish } =
    useCloudSignal({ preset: "desktop", debug: false, onMessage: handleMessage, skipMessageStore: true });

  // Connect to the room
  const joinRoom = useCallback(
    async (credentials: { username: string; password: string }) => {
      userIdRef.current = credentials.username;
      setUserId(credentials.username);
      connectStartRef.current = Date.now();

      await connect({
        host: process.env.NEXT_PUBLIC_CLOUDSIGNAL_WSS_URL || "wss://connect.cloudsignal.app:18885/",
        username: credentials.username,
        password: credentials.password,
      });
    },
    [connect]
  );

  // Subscribe once connected
  useEffect(() => {
    if (isConnected) {
      setStats(s => ({ ...s, connectionTime: Date.now() - connectStartRef.current }));
      subscribe(topic, 0);
    }
  }, [isConnected, subscribe, topic]);

  // Publish own cursor position (throttled)
  const publishCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastPublishRef.current < throttleMsRef.current) return;
      lastPublishRef.current = now;

      const color = getColorForUser(userIdRef.current);
      publish(topic, {
        id: userIdRef.current,
        name: userName,
        x,
        y,
        color: color.hex,
        ts: now,
      }, { qos: 0 });
    },
    [publish, topic, userName]
  );

  // 1Hz tick: sync ref stats to state for header display + clean stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, cursor] of cursorsRef.current) {
        if (now - cursor.lastSeen > staleMs) {
          cursorsRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) {
        onUpdateRef.current?.();
      }

      setStats({
        latency: latencyRef.current,
        messageCount: messageCountRef.current,
        connectionTime: null, // preserve existing
        onlineCount: cursorsRef.current.size,
      });
      // Preserve connectionTime from initial set
      setStats(s => ({ ...s, latency: latencyRef.current, messageCount: messageCountRef.current, onlineCount: cursorsRef.current.size }));
    }, 1000);
    return () => clearInterval(interval);
  }, [staleMs]);

  return {
    cursorsRef,
    onUpdateRef,
    stats,
    isConnected,
    isConnecting,
    error,
    joinRoom,
    disconnect,
    publishCursor,
    userId,
  };
}
