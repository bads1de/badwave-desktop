import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import Player from "@/components/Player/Player";
import RightSidebar from "@/components/RightSidebar/RightSidebar";
import Sidebar from "@/components/Sidebar/Sidebar";
import WindowControls from "@/components/electron/WindowControls";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import OfflineRedirector from "@/components/common/OfflineRedirector";

import ModalProvider from "@/providers/ModalProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import PlaybackStateProvider from "@/providers/PlaybackStateProvider";

import ToasterProvider from "@/providers/ToasterProvider";
import UserProvider from "@/providers/UserProvider";
import TanStackProvider from "@/providers/TanStackProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import "./globals.css";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BadWave",
  description: "Listen to music!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <ToasterProvider />
        <TanStackProvider>
          <UserProvider>
            <SyncProvider>
              <ThemeProvider>
                <PlaybackStateProvider>
                  <ModalProvider />
                  <WindowControls />
                  <div className="app-wrapper">
                    <Sidebar>
                      <RightSidebar>{children}</RightSidebar>
                    </Sidebar>
                    <Player />
                  </div>
                  <OfflineIndicator />
                  <OfflineRedirector />
                </PlaybackStateProvider>
              </ThemeProvider>
            </SyncProvider>
          </UserProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
