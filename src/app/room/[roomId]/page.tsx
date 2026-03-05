"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useCursors } from "@/hooks/use-cursors";
import { RemoteCursor } from "@/components/remote-cursor";
import { getColorForUser } from "@/lib/colors";

export default function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ user?: string }>;
}) {
  const { roomId } = use(params);
  const { user } = use(searchParams);

  const [userName, setUserName] = useState(user || "");
  const [joined, setJoined] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(Date.now());

  const {
    cursors,
    latency,
    messageCount,
    connectionTime,
    isConnected,
    isConnecting,
    error,
    joinRoom,
    publishCursor,
    userId,
  } = useCursors({ roomId, userName });

  // Tick for cursor fade-out opacity
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [joined]);

  // Track container dimensions
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [joined]);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      publishCursor(x, y);
    },
    [publishCursor]
  );

  // Join room
  const handleJoin = async () => {
    if (!userName.trim()) return;

    const res = await fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: userName.trim() }),
    });

    if (!res.ok) {
      alert("Failed to get token");
      return;
    }

    const credentials = await res.json();
    await joinRoom(credentials);
    setJoined(true);
  };

  // Auto-join if user param provided
  useEffect(() => {
    if (user && !joined) {
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Join screen
  if (!joined && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            Join Room
          </h1>
          <p className="mb-4 text-sm text-gray-500">
            Room: <span className="font-mono font-medium">{roomId}</span>
          </p>
          <input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="mb-4 w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={!userName.trim() || isConnecting}
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Join"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-500">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  const userColor = userId ? getColorForUser(userId) : null;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {userColor && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: userColor.hex }}
            />
          )}
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {latency !== null && <span>{latency}ms latency</span>}
          {connectionTime !== null && <span>{connectionTime}ms connect</span>}
          <span>{messageCount} msgs</span>
          <span>{cursors.size} online</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 cursor-none overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Remote cursors */}
        {Array.from(cursors.values()).map((cursor) => (
          <RemoteCursor
            key={cursor.id}
            cursor={cursor}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}
