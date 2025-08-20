"use client";

import useSWR from "swr";
import TraderTable from "@/components/TraderTable";

export default function RunPageClient({ runId }: { runId: string }) {
  const { data, error } = useSWR(`/api/runs/${runId}`, (u) =>
    fetch(u, { cache: "no-store" }).then((r) => r.json())
  );

  if (error) return <div>Fehler: {String(error)}</div>;
  if (!data) return <div>Lade…</div>;

  // TEMP: debug output im Browser
  console.log("RUN API payload", data);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-semibold">Run {runId}</h1>
      <div className="text-sm text-gray-600">Snapshots: {data.count ?? 0}</div>
      <TraderTable items={data.items ?? []} />
    </div>
  );
}
