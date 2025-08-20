"use client";

import { useEffect, useState } from "react";

type Trader = {
  id: string;
  address: string;
  pnlUsd: number;
  roi: number;
  winrate: number;
  profitFactor: number;
  sharpe: number;
  trades: number;
  uniqueTokens: number;
  medianHoldH: number;
  lowCapShare: number;
  score: number;
  flags: string | null;
  createdAt: string;
};

export default function TradersPage() {
  const [items, setItems] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/traders", {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json();
        setItems(json.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-dvh mx-auto max-w-6xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Trader Snapshots</h1>
      <p className="text-sm text-muted-foreground">
        Lädt gespeicherte Ergebnisse aus SQLite (zuletzt zuerst).
      </p>

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade…</div>
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Score",
                  "Adresse",
                  "ROI",
                  "PnL $",
                  "Win%",
                  "PF",
                  "Sharpe",
                  "Trades",
                  "Tokens",
                  "LowCap%",
                  "Flags",
                  "Zeit",
                ].map((h) => (
                  <th key={h} className="text-left p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-semibold">{r.score}</td>
                  <td className="p-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(r.address)}
                      className="underline"
                      title="Adresse kopieren"
                    >
                      {r.address.slice(0, 6)}…{r.address.slice(-6)}
                    </button>
                  </td>
                  <td className="p-2">{(r.roi * 100).toFixed(1)}%</td>
                  <td className="p-2">{r.pnlUsd.toFixed(0)}</td>
                  <td className="p-2">{(r.winrate * 100).toFixed(0)}%</td>
                  <td className="p-2">{r.profitFactor.toFixed(2)}</td>
                  <td className="p-2">{r.sharpe.toFixed(2)}</td>
                  <td className="p-2">{r.trades}</td>
                  <td className="p-2">{r.uniqueTokens}</td>
                  <td className="p-2">{(r.lowCapShare * 100).toFixed(0)}%</td>
                  <td className="p-2">{r.flags ?? ""}</td>
                  <td className="p-2">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
