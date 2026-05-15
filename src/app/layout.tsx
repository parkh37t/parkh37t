import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { GoogleReconnectBanner } from "@/components/google-reconnect-banner";
import { TaskModalProvider } from "@/components/task-modal/provider";

export const metadata: Metadata = {
  title: "Parkh37t Dashboard",
  description: "Personal schedule and task dashboard",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7C6BF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TaskModalProvider>
          <Nav />
          <GoogleReconnectBanner />
          <main className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-10 pb-24 pt-6 lg:pt-10">
            {children}
          </main>
          <footer className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-10 pb-10 pt-2 text-[12px] text-ink-muted flex items-center justify-center gap-1.5">
            Todo Dashboard · 데이터는 자동 저장됩니다
          </footer>
        </TaskModalProvider>
      </body>
    </html>
  );
}
