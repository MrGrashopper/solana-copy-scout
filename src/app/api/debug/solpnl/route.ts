import { NextResponse } from "next/server";
import { computeSolPnl } from "@/lib/metrics/solpnl";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
function isPlausibleSolAddress(addr: string) {
  const a = addr.trim();
  return a.length >= 32 && a.length <= 44 && BASE58.test(a);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();
  const days = Number(searchParams.get("days") ?? "7");

  if (!isPlausibleSolAddress(address)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "address must be a plausible Solana wallet (Base58, 32–44 chars)",
      },
      { status: 400 }
    );
  }
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing HELIUS_API_KEY in environment" },
      { status: 500 }
    );
  }

  try {
    const res = await computeSolPnl({ address, days, apiKey });
    return NextResponse.json({ ok: true, address, ...res });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
