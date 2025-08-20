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
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error || `Scan fehlgeschlagen (${res.status})`;
        alert(msg);
        return;
      }

      if (json?.runId) {
        router.push(`/runs/${json.runId}`);
      } else {
        alert("Scan erfolgreich, aber keine runId erhalten.");
      }
    } catch (e: any) {
      alert(`Netzwerk-/Serverfehler: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Solana Copy‑Scout (MVP)</h1>
      <p className="text-sm text-muted-foreground">
        Discovery & Ranking (echte Persistenz, heuristische Scores).
      </p>

      <div className="flex gap-2">
        <button
          onClick={runPipeline}
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-black text-white disabled:opacity-60"
          aria-busy={loading}
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
