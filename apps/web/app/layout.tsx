import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { clerkPublishableKey, isClerkConfigured } from "../lib/clerk-config";
import "./globals.css";

const siteDescription =
  "Version-aware skincare discovery, trusted cross-market price context, and private shopping planning.";

export const metadata: Metadata = {
  title: {
    default: "PuruPuru",
    template: "%s · PuruPuru",
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
    <html lang="en">
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
