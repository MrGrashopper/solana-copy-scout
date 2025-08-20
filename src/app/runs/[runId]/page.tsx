import RunPageClient from "./RunPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <RunPageClient runId={runId} />;
}
