"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useCursors } from "@/hooks/use-cursors";
import { CursorCanvas } from "@/components/remote-cursor";
import { getColorForUser } from "@/lib/colors";

// Hoisted outside component — Next.js inlines NEXT_PUBLIC_ at build time
const USER_CREDENTIALS: Record<string, { username: string; password: string } | undefined> = {
  ALICE: process.env.NEXT_PUBLIC_ALICE_USERNAME && process.env.NEXT_PUBLIC_ALICE_PASSWORD
    ? { username: process.env.NEXT_PUBLIC_ALICE_USERNAME, password: process.env.NEXT_PUBLIC_ALICE_PASSWORD }
    : undefined,
  BOB: process.env.NEXT_PUBLIC_BOB_USERNAME && process.env.NEXT_PUBLIC_BOB_PASSWORD
    ? { username: process.env.NEXT_PUBLIC_BOB_USERNAME, password: process.env.NEXT_PUBLIC_BOB_PASSWORD }
    : undefined,
};

export default function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ user?: string; mode?: string }>;
}) {
  const { roomId } = use(params);
  const { user, mode } = use(searchParams);
  const isViewer = mode === "viewer";

  const [userName, setUserName] = useState(user || "");
  const [joined, setJoined] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [burstUntil, setBurstUntil] = useState(0);
  const [burstTick, setBurstTick] = useState(0);
  const isBurst = burstTick < burstUntil;
  const throttleMs = isBurst ? 16 : 30;

  const {
    cursorsRef,
    onUpdateRef,
    stats,
    isConnected,
    isConnecting,
    error,
    joinRoom,
    publishCursor,
    userId,
  } = useCursors({ roomId, userName, throttleMs });

  // Burst mode countdown — only tick while burst is active
  useEffect(() => {
    if (burstUntil === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setBurstTick(now);
      if (now >= burstUntil) {
        setBurstUntil(0);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [burstUntil]);

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

    const credentials = USER_CREDENTIALS[userName.trim().toUpperCase()];
    if (!credentials) {
      alert(`No credentials configured for "${userName}". Supported users: ${Object.keys(USER_CREDENTIALS).filter(k => USER_CREDENTIALS[k]).join(", ") || "none — check your environment variables"}`);
      return;
    }

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
          {!isViewer && (
            <button
              onClick={() => {
                const target = Date.now() + 10000;
                setBurstUntil(target);
                setBurstTick(Date.now());
              }}
              className={`rounded px-2 py-0.5 font-medium transition-colors ${
                isBurst
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isBurst ? "60Hz" : "33Hz"}
            </button>
          )}
          {stats.latency !== null && <span>{stats.latency}ms latency</span>}
          {stats.connectionTime !== null && <span>{stats.connectionTime}ms connect</span>}
          <span>{stats.messageCount} msgs</span>
          <span>{stats.onlineCount} online</span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        onMouseMove={isViewer ? undefined : handleMouseMove}
      >
        <CursorCanvas
          cursorsRef={cursorsRef}
          onUpdateRef={onUpdateRef}
          containerRef={canvasRef}
        />
      </div>
    </div>
  );
}
