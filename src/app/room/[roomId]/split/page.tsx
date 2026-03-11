"use client";

import { use } from "react";
import { CursorPanel } from "@/components/cursor-panel";

const USER_CREDENTIALS = {
  ALICE: process.env.NEXT_PUBLIC_ALICE_USERNAME && process.env.NEXT_PUBLIC_ALICE_PASSWORD
    ? { username: process.env.NEXT_PUBLIC_ALICE_USERNAME, password: process.env.NEXT_PUBLIC_ALICE_PASSWORD }
    : null,
  BOB: process.env.NEXT_PUBLIC_BOB_USERNAME && process.env.NEXT_PUBLIC_BOB_PASSWORD
    ? { username: process.env.NEXT_PUBLIC_BOB_USERNAME, password: process.env.NEXT_PUBLIC_BOB_PASSWORD }
    : null,
};

export default function SplitPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  if (!USER_CREDENTIALS.BOB || !USER_CREDENTIALS.ALICE) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">
          Missing credentials. Check NEXT_PUBLIC_ALICE_* and NEXT_PUBLIC_BOB_* env vars.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Bob — sender */}
      <div className="flex-1 border-r">
        <CursorPanel
          roomId={roomId}
          userName="Bob"
          credentials={USER_CREDENTIALS.BOB}
        />
      </div>

      {/* Alice — viewer */}
      <div className="flex-1">
        <CursorPanel
          roomId={roomId}
          userName="Alice"
          credentials={USER_CREDENTIALS.ALICE}
          isViewer
        />
      </div>
    </div>
  );
}
