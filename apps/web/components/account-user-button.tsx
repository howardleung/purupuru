"use client";

import { useClerk } from "@clerk/nextjs";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { AccountIdentity } from "../lib/account-identity";

const fallbackIdentity: AccountIdentity = {
  displayName: "PuruPuru User",
  avatar: null,
};

export function AccountUserButton({ identity }: { identity: AccountIdentity | null }) {
  const { openUserProfile, signOut } = useClerk();
  const resolvedIdentity = identity ?? fallbackIdentity;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-label={`Open account menu for ${resolvedIdentity.displayName}`}
        className="flex min-h-11 max-w-[12rem] items-center gap-2 rounded-full py-1 pl-2 pr-1 text-brand-ink transition hover:bg-slate-100"
        onClick={() => setIsOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <span className="hidden max-w-28 truncate text-sm font-bold sm:block">
          {resolvedIdentity.displayName}
        </span>
        {resolvedIdentity.avatar ? (
          <Image
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 bg-white"
            height={36}
            src={resolvedIdentity.avatar.assetPath}
            width={36}
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-brand-action">
            <UserRound aria-hidden className="h-5 w-5" />
          </span>
        )}
        <ChevronDown aria-hidden className={`hidden h-4 w-4 shrink-0 transition sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div
          aria-label="Account menu"
          className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-float"
          id={menuId}
        >
          <p className="truncate px-3 pb-2 pt-1 text-xs font-bold text-slate-500">
            {resolvedIdentity.displayName}
          </p>
          <Link
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            href="/profile"
            onClick={() => setIsOpen(false)}
            ref={firstLinkRef}
          >
            <UserRound aria-hidden className="h-4 w-4" /> Profile
          </Link>
          <button
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            onClick={() => {
              setIsOpen(false);
              void openUserProfile();
            }}
            type="button"
          >
            <Settings aria-hidden className="h-4 w-4" /> Manage account
          </button>
          <button
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            onClick={() => {
              setIsOpen(false);
              void signOut({ redirectUrl: "/" });
            }}
            type="button"
          >
            <LogOut aria-hidden className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
