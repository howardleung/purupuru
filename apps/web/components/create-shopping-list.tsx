"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createShoppingList } from "../app/shopping-lists/actions";
import { SUPPORTED_TARGET_MARKETS } from "../lib/markets";

export function CreateShoppingList() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetMarket, setTargetMarket] = useState("JP");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Create a list</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Name
          <input
            className="ui-input font-normal"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="Japan Trip"
            value={name}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Target market
          <select
            className="ui-input font-normal"
            onChange={(event) => setTargetMarket(event.target.value)}
            value={targetMarket}
          >
            {SUPPORTED_TARGET_MARKETS.map((market) => (
              <option key={market.code} value={market.code}>{market.name}</option>
            ))}
          </select>
        </label>
        <button
          className="ui-button ui-button--primary self-end"
          disabled={isPending || !name.trim()}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await createShoppingList({ name, targetMarket });
              setMessage(result.message);
              if (result.status === "SUCCESS" && result.listId) {
                setName("");
                router.push(`/shopping-lists/${result.listId}`);
              }
            });
          }}
          type="button"
        >
          {isPending ? "Creating…" : "Create"}
        </button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-600">{message}</p>
    </section>
  );
}
