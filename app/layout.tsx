import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const noto = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "저택의 비밀 | Murder Mystery Game",
  description: "온라인 실시간 머더미스터리 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${noto.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Lobster&family=Bebas+Neue&family=Abril+Fatface&family=Oswald:wght@700&family=Alfa+Slab+One&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="dark min-h-screen bg-[#0d0d0d] text-[#f5f5dc] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
