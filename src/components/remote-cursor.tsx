"use client";

import { CursorPosition } from "@/hooks/use-cursors";

interface RemoteCursorProps {
  cursor: CursorPosition;
  containerWidth: number;
  containerHeight: number;
  now: number;
}

export function RemoteCursor({ cursor, containerWidth, containerHeight, now }: RemoteCursorProps) {
  const x = cursor.x * containerWidth;
  const y = cursor.y * containerHeight;
  const age = now - cursor.lastSeen;
  const opacity = age > 3000 ? Math.max(0, 1 - (age - 3000) / 7000) : 1;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: "transform 30ms linear",
        opacity,
      }}
    >
      {/* Cursor arrow SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="-translate-x-[2px] -translate-y-[2px]"
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Name label */}
      <div
        className="ml-4 mt-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-white shadow-sm"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.name}
      </div>
    </div>
  );
}
