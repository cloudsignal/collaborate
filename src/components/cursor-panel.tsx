"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCursors } from "@/hooks/use-cursors";
import { CursorCanvas } from "@/components/remote-cursor";
import { getColorForUser } from "@/lib/colors";

interface CursorPanelProps {
  roomId: string;
  userName: string;
  credentials: { username: string; password: string };
  isViewer?: boolean;
}

export function CursorPanel({ roomId, userName, credentials, isViewer = false }: CursorPanelProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

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
  } = useCursors({ roomId, userName, throttleMs: 16 });

  // Auto-join on mount
  useEffect(() => {
    joinRoom(credentials);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const userColor = userId ? getColorForUser(userId) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-2">
          {userColor && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: userColor.hex }}
            />
          )}
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          {isViewer && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              VIEWER
            </span>
          )}
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`}
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {stats.latency !== null && <span>{stats.latency}ms</span>}
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

        {/* Status overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        )}
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <p className="text-sm text-gray-500">Connecting...</p>
          </div>
        )}
        {!isViewer && isConnected && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300">Move mouse here</p>
          </div>
        )}
      </div>
    </div>
  );
}
