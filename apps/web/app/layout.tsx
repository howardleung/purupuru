import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";

import { AnalyticsProvider } from "../components/analytics-provider";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { clerkPublishableKey, isClerkConfigured } from "../lib/clerk-config";
import { LikeProvider } from "../components/like-provider";
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
  const content = <>
    <SiteHeader />
    <div className="flex-1">{children}</div>
    <SiteFooter />
  </>;
  const document = (
    <html className={nunito.variable} lang="en">
      <body className="flex min-h-screen flex-col">
        <AnalyticsProvider production={process.env.NODE_ENV === "production" && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production")}>
          {isClerkConfigured ? <LikeProvider>{content}</LikeProvider> : content}
        </AnalyticsProvider>
      </body>
    </html>
  );

  if (!isClerkConfigured || !clerkPublishableKey) {
    return document;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{document}</ClerkProvider>;
}
