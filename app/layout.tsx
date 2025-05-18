import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import getPlaylists from "@/actions/getPlaylists";

import Player from "@/components/Player/Player";
import RightSidebar from "@/components/RightSidebar/RightSidebar";
import Sidebar from "@/components/Sidebar/Sidebar";
import WindowControls from "@/components/electron/WindowControls";

import ModalProvider from "@/providers/ModalProvider";

import ToasterProvider from "@/providers/ToasterProvider";
import UserProvider from "@/providers/UserProvider";
import TanStackProvider from "@/providers/TanStackProvider";
import "./globals.css";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BadWave",
  description: "Listen to music!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playlists = await getPlaylists();

  return (
    <html lang="en">
      <body className={font.className}>
        <ToasterProvider />
        <TanStackProvider>
          <UserProvider>
            <ModalProvider />
            <WindowControls />
            <Sidebar>
              <RightSidebar>{children}</RightSidebar>
            </Sidebar>
            <Player playlists={playlists} />
          </UserProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
