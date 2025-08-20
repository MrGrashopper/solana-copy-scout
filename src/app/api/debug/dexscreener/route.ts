import { NextResponse } from "next/server";
import { getPairsByToken } from "@/lib/providers/dexscreener";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get("mint");
  const chain = searchParams.get("chain") ?? "solana";

  if (!mint) {
    return NextResponse.json(
      { ok: false, error: "Missing ?mint=<tokenMint>" },
      { status: 400 }
    );
  }

  try {
    const pairs = await getPairsByToken(chain, mint);
    // Für die Sichtprüfung nur die wichtigsten Felder zurückgeben
    const simplified = pairs.slice(0, 5).map((p) => ({
      chainId: p.chainId,
      pairAddress: p.pairAddress,
      base: p.baseToken,
      quote: p.quoteToken,
      priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
      liquidityUsd: p.liquidity?.usd ?? null,
      fdv: p.fdv ?? p.marketCap ?? null,
      pairCreatedAt: p.pairCreatedAt ?? null,
    }));

    return NextResponse.json({
      ok: true,
      count: pairs.length,
      items: simplified,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
