import { NextResponse } from "next/server";
import { fetchAddressTxs } from "@/lib/providers/helius";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("address") || "").trim();
  const days = Number(searchParams.get("days") ?? "7");

  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing HELIUS_API_KEY in .env" },
      { status: 500 }
    );
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 3600;

  try {
    const txs = await fetchAddressTxs(raw, start, end, apiKey, 1000);
    const items = txs.slice(0, 20).map((tx) => ({
      signature: tx.signature,
      ts: tx.timestamp,
      date: new Date(tx.timestamp * 1000).toISOString(),
      legs:
        tx.events?.swap?.[0]?.tokenTransfers?.map((t) => ({
          mint: t.mint,
          amt: t.tokenAmount,
          from: t.fromUserAccount,
          to: t.toUserAccount,
        })) ?? [],
    }));
    return NextResponse.json({
      ok: true,
      address: raw,
      count: txs.length,
      items,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, address: raw, error: (e as Error).message },
      { status: 500 }
    );
  }
}
