import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import Sidebar from "@/components/Sidebar/Sidebar";
import Player from "@/components/Player/Player";
import RightSidebar from "@/components/RightSidebar/RightSidebar";

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
        <Sidebar>
          <RightSidebar>{children}</RightSidebar>
        </Sidebar>
        <Player playlists={[]} />
      </body>
    </html>
  );
}
