"use client";

import useSWR from "swr";
import { TraderTable } from "@/components/TraderTable";

export default function RunPageClient({ runId }: { runId: string }) {
  const { data, error } = useSWR(`/api/runs/${runId}`, (url) =>
    fetch(url).then((r) => r.json())
  );

  if (error) return <div>Fehler: {error.message}</div>;
  if (!data) return <div>Lade…</div>;

  const snapshots = data.run?.snapshots ?? [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Run {runId}</h1>
      <TraderTable data={snapshots} />
    </div>
  );
}
