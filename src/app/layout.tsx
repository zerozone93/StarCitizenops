import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import { SpaceParallaxBackground } from "@/components/space-parallax-background";
import { FloatingBubble } from "@/components/floating-bubble";
import { ChatDock } from "@/components/social/chat-dock";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Rajdhani({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StarCitizenOps",
  description: "Social operations planning platform for Star Citizen organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SpaceParallaxBackground />
        <FloatingBubble />
        <ChatDock />
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
