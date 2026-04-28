import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIGMA — Ideate. Extract. Execute.",
  description:
    "The collaborative workspace where ideas become action. Real-time sync, AI-powered extraction, and enterprise-grade security — all on a canvas of sticky notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ scrollBehavior: "smooth" }}
    >
      <body
        style={{
          backgroundColor: "#F5F1E4",
          color: "#231F20",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </body>
    </html>
  );
}
