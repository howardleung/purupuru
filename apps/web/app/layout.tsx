import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { clerkPublishableKey, isClerkConfigured } from "../lib/clerk-config";
import "./globals.css";

const nunito = localFont({
  src: "./fonts/Nunito-Variable.ttf",
  display: "swap",
  variable: "--font-nunito",
  weight: "200 1000",
});

const siteDescription =
  "Compare tracked retailer prices for the skincare product and size you want, shop smarter, and spend less.";

export const metadata: Metadata = {
  title: {
    default: "PuruPuru",
    template: "%s | PuruPuru",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "PuruPuru",
    title: "PuruPuru",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "PuruPuru",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const document = (
    <html className={nunito.variable} lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );

  if (!isClerkConfigured || !clerkPublishableKey) {
    return document;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{document}</ClerkProvider>;
}
