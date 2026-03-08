"use client";

export default function Home() {
  const roomId = "demo";

  const openBothTabs = () => {
    window.open(`/room/${roomId}?user=Bob`, "_blank");
    window.open(`/room/${roomId}?user=Alice&mode=viewer`, "_blank");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">
          CloudSignal Realtime Cursors
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          Open two tabs side by side. Bob moves the cursor, Alice sees it in real-time.
        </p>

        <button
          onClick={openBothTabs}
          className="mb-6 w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-600"
        >
          Open Both Tabs
        </button>

        <div className="flex gap-3">
          <a
            href={`/room/${roomId}?user=Bob`}
            target="_blank"
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-white"
          >
            Bob (leader)
          </a>
          <a
            href={`/room/${roomId}?user=Alice&mode=viewer`}
            target="_blank"
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-300 hover:border-gray-400 hover:text-white"
          >
            Alice (viewer)
          </a>
        </div>
      </div>
    </div>
  );
}
