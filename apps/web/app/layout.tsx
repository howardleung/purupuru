import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { SiteHeader } from "../components/site-header";
import { clerkPublishableKey, isClerkConfigured } from "../lib/clerk-config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Otoku",
    template: "%s · Otoku",
  },
  description: "Global skincare discovery and shopping intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const document = (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );

  if (!isClerkConfigured || !clerkPublishableKey) {
    return document;
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{document}</ClerkProvider>;
}
