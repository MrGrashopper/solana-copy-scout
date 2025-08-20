// src/components/TraderTable.tsx
"use client";

type Row = {
  id: string;
  address: string;
  score: number;
  pnlSol?: number;
  trades: number;
  uniqueTokens: number;
  flags?: string | null;
};

export default function TraderTable({ items }: { items: Row[] }) {
  if (!items?.length)
    return (
      <div className="text-sm text-gray-500">
        Keine Ergebnisse für diesen Run.
      </div>
    );

  return (
    <table className="table-auto border-collapse border border-gray-300 w-full">
      <thead>
        <tr>
          <th className="border px-2 py-1 text-right">Score</th>
          <th className="border px-2 py-1">Adresse</th>
          <th className="border px-2 py-1 text-right">PnL (SOL)</th>
          <th className="border px-2 py-1 text-right">Trades</th>
          <th className="border px-2 py-1 text-right">Tokens</th>
          <th className="border px-2 py-1">Flags</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td className="border px-2 py-1 text-right">{s.score}</td>
            <td className="border px-2 py-1 font-mono text-xs">{s.address}</td>
            <td className="border px-2 py-1 text-right">
              {(s.pnlSol ?? 0).toFixed(4)}
            </td>
            <td className="border px-2 py-1 text-right">{s.trades}</td>
            <td className="border px-2 py-1 text-right">{s.uniqueTokens}</td>
            <td className="border px-2 py-1">{s.flags ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
