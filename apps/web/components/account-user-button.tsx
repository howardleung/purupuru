"use client";

import { UserButton } from "@clerk/nextjs";
import { UserRound } from "lucide-react";

export function AccountUserButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          href="/profile"
          label="Profile"
          labelIcon={<UserRound aria-hidden size={16} />}
        />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
