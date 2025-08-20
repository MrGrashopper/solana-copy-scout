"use client";
import { useState } from "react";
import type { TraderRow } from "@/types/trader";

export function TraderTable({ data }: { data: TraderRow[] }) {
  const [q, setQ] = useState("");
  const rows = data.filter((r) =>
    r.address.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <input
        placeholder="Adresse filtern…"
        className="border rounded-md px-2 py-1 text-sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
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
              ].map((h) => (
                <th key={h} className="text-left p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
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
                <td className="p-2">{r.flags?.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
