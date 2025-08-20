"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function runPipeline() {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline/run", { method: "POST" });

      if (!res.ok) {
        // Optional: Fehlertext auslesen
        const text = await res.text();
        console.error("Pipeline API error:", res.status, text);
        return;
      }
      const json = await res.json();
      if (json?.ok && json.runId) router.push(`/runs/${json.runId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Solana Copy‑Scout (MVP)</h1>
      <p className="text-sm text-muted-foreground">
        Discovery & Ranking (Fake‑Metriken, echte Persistenz).
      </p>

      <div className="flex gap-2">
        <button
          onClick={runPipeline}
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-60"
        >
          {loading ? "Scan läuft…" : "Scan starten"}
        </button>

        <a href="/traders" className="rounded-lg px-4 py-2 border">
          Zu gespeicherten Tradern
        </a>
      </div>
    </main>
  );
}
