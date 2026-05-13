import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "OXA — Party Games for Real Ones",
  description: "Truth or Dare, Letter Blitz, and more party games",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        
      </head>
      <body className="grid-bg noise-overlay min-h-screen">
        {children}
      </body>
    </html>
  );
}