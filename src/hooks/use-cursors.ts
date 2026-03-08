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
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [latency, setLatency] = useState<number | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [connectionTime, setConnectionTime] = useState<number | null>(null);

  const [userId, setUserId] = useState("");
  const userIdRef = useRef<string>("");
  const lastPublishRef = useRef(0);
  const connectStartRef = useRef(0);
  const throttleMsRef = useRef(throttleMs);

  useEffect(() => {
    throttleMsRef.current = throttleMs;
  }, [throttleMs]);

  const topic = `rooms/${roomId}/cursors`;

  // Handle incoming cursor messages
  const handleMessage = useCallback(
    (_topic: string, payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;
      const data = payload as { id?: string; name?: string; x?: number; y?: number; color?: string; ts?: number };
      if (!data.id || data.id === userIdRef.current) return;

      const now = Date.now();
      if (data.ts) {
        setLatency(now - data.ts);
      }
      setMessageCount((prev) => prev + 1);

      setCursors((prev) => {
        const next = new Map(prev);
        next.set(data.id!, {
          id: data.id!,
          name: data.name || "Unknown",
          x: data.x || 0,
          y: data.y || 0,
          color: data.color || "#3B82F6",
          ts: data.ts || now,
          lastSeen: now,
        });
        return next;
      });
    },
    []
  );

  const { isConnected, isConnecting, error, connect, disconnect, subscribe, publish } =
    useCloudSignal({ preset: "desktop", debug: false, onMessage: handleMessage });

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
      setConnectionTime(Date.now() - connectStartRef.current);
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

  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors((prev) => {
        const now = Date.now();
        const next = new Map(prev);
        let changed = false;
        for (const [id, cursor] of next) {
          if (now - cursor.lastSeen > staleMs) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [staleMs]);

  return {
    cursors,
    latency,
    messageCount,
    connectionTime,
    isConnected,
    isConnecting,
    error,
    joinRoom,
    disconnect,
    publishCursor,
    userId,
  };
}
