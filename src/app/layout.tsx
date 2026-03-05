import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudSignal Realtime Cursors",
  description: "Real-time cursor tracking demo powered by CloudSignal MQTT over WebSocket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
