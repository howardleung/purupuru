import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Costmetic",
  description: "Global skincare discovery and shopping intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
