export default function Home() {
  const roomId = "demo";

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">
            CloudSignal Realtime Cursors
          </h1>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            Demo
          </span>
        </div>
        <a
          href={`/room/${roomId}`}
          target="_blank"
          className="text-sm text-gray-400 hover:text-white"
        >
          Open standalone
        </a>
      </div>

      {/* Split panels */}
      <div className="flex flex-1">
        <div className="flex-1 border-r border-gray-700">
          <iframe
            src={`/room/${roomId}?user=Alice`}
            className="h-full w-full"
            title="User Alice"
          />
        </div>
        <div className="flex-1">
          <iframe
            src={`/room/${roomId}?user=Bob&mode=viewer`}
            className="h-full w-full"
            title="User Bob"
          />
        </div>
      </div>
    </div>
  );
}
