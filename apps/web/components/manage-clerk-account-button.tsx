"use client";

import { useClerk } from "@clerk/nextjs";
import { ExternalLink } from "lucide-react";

export function ManageClerkAccountButton() {
  const { openUserProfile } = useClerk();
  return (
    <button className="ui-button ui-button--secondary" onClick={() => void openUserProfile()} type="button">
      Manage account <ExternalLink aria-hidden className="h-4 w-4" />
    </button>
  );
}
