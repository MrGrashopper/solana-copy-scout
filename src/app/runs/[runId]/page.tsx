// src/app/runs/[runId]/page.tsx
import RunPageClient from "./RunPageClient";

export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params; // Promise entpacken

  return <RunPageClient runId={runId} />;
}
