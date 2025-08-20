"use client";
import { useState } from "react";
import { TraderTable } from "@/components/TraderTable";
import type { TraderRow } from "@/types/trader";

export default function ClientPage() {
  const [items, setItems] = useState<TraderRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/traders", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const json = await res.json();
      setItems(json.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Solana Copy‑Scout (MVP)</h1>
      <p className="text-sm text-muted-foreground">
        Discovery & Ranking (Stub‑Daten). „Aktualisieren“ lädt Liste.
      </p>

      <button
        onClick={refresh}
        disabled={loading}
        className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-60"
      >
        {loading ? "Lädt…" : "Aktualisieren"}
      </button>

      <TraderTable data={items} />
    </main>
  );
}
