"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteDeckButton({ deckId, deckName }: { deckId: string; deckName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.preventDefault()}
      >
        <span className="text-xs text-red-500">Radera &quot;{deckName}&quot;?</span>
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
        >
          Ja
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-cream-dark px-3 py-1 text-xs font-semibold text-gray transition-colors hover:bg-cream-dark/80"
        >
          Nej
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="rounded-lg p-1.5 text-gray/50 transition-colors hover:text-red-500 hover:bg-red-50"
      title="Radera deck"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </button>
  );
}
