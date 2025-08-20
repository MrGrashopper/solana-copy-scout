import { NextResponse } from "next/server";

// --- kleine RPC-Helpers ---
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
type RpcBody = { jsonrpc: "2.0"; id: string; method: string; params: any[] };

async function rpc<T = any>(body: RpcBody): Promise<T> {
  const res = await fetch(HELIUS, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Helius ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.error)
    throw new Error(`Helius RPC error: ${json.error.message ?? "unknown"}`);
  return json.result as T;
}

// getSignaturesForAddress: jüngste N Signaturen eines Programms
async function getSignatures(program: string, limit: number) {
  return rpc<Array<{ signature: string; blockTime?: number }>>({
    jsonrpc: "2.0",
    id: "disc-sigs",
    method: "getSignaturesForAddress",
    params: [program, { limit }],
  });
}

// getTransaction: Details (für feePayer)
async function getTx(signature: string) {
  return rpc<{
    transaction?: {
      message?: {
        accountKeys?: Array<string | { pubkey: string }>;
      };
    };
    meta?: any;
  }>({
    jsonrpc: "2.0",
    id: "disc-tx",
    method: "getTransaction",
    // wichtig: encoding "jsonParsed", Version 0 reicht i.d.R.
    params: [
      signature,
      { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" },
    ],
  });
}

// simple Concurrency-Limiter
async function pMapLimit<I, O>(
  items: I[],
  limit: number,
  fn: (it: I, i: number) => Promise<O>
): Promise<O[]> {
  const ret: O[] = [];
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(workers);
  return ret;
}

export async function GET(req: Request) {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { ok: false, error: "Missing HELIUS_API_KEY" },
        { status: 500 }
      );

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? "3");
    const perProgram = Number(searchParams.get("perProgram") ?? "120");
    const minSwaps = Number(searchParams.get("minSwaps") ?? "1");
    const maxWallets = Number(searchParams.get("maxWallets") ?? "50");

    // NEU: ?programs=ID1,ID2 überschreibt ENV
    const programsParam = (searchParams.get("programs") ?? "").trim();
    const envPrograms = (process.env.DEX_PROGRAMS ?? "").trim();

    const programsRaw = programsParam.length ? programsParam : envPrograms;
    const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
    const isPlausible = (a: string) =>
      a && a.length >= 32 && a.length <= 44 && BASE58.test(a);

    const programs = programsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(isPlausible);

    if (!programs.length) {
      return NextResponse.json(
        { ok: false, error: "No DEX_PROGRAMS or ?programs provided" },
        { status: 400 }
      );
    }

    const since = Math.floor(Date.now() / 1000) - days * 24 * 3600;

    // 1) Signaturen je Programm
    const programSigs = await Promise.all(
      programs.map((p) => getSignatures(p, perProgram))
    );

    // Debug: wie viele Sigs je Programm
    const sigCounts = programSigs.map((arr) => arr.length);

    const allSigs = programSigs
      .flat()
      .filter((s) => !s.blockTime || s.blockTime >= since)
      .map((s) => s.signature);

    const uniqueSigs = Array.from(new Set(allSigs)).slice(
      0,
      programs.length * perProgram
    );

    // 2) TX-Details holen und feePayer zählen
    const feePayerCounts = new Map<string, number>();
    const sigChunks = chunk(uniqueSigs, 100); // 100er Batches sind ok

    for (const ch of sigChunks) {
      try {
        const txs = await getParsedTransactionsBatch(ch);
        for (const tx of txs ?? []) {
          const keys = tx?.transaction?.message?.accountKeys ?? [];
          // normalize key → string
          const pk = (k: any) => (typeof k === "string" ? k : k?.pubkey);
          const feePayer = pk(keys[0]); // fee payer = key[0]
          if (isPlausible(feePayer) && !programs.includes(feePayer)) {
            feePayerCounts.set(
              feePayer,
              (feePayerCounts.get(feePayer) ?? 0) + 1
            );
          }
        }
      } catch {
        // batch fail → weiter mit nächstem chunk
      }
    }
    await pMapLimit(uniqueSigs, 6, async (sig) => {
      try {
        const tx = await getTx(sig);
        const keys = tx.transaction?.message?.accountKeys ?? [];
        // keys kann string[] ODER {pubkey}[] sein → normalize:
        const pk = (k: any) => (typeof k === "string" ? k : k?.pubkey);
        const feePayer = pk(keys[0]); // payer = index 0

        if (isPlausible(feePayer) && !programs.includes(feePayer)) {
          feePayerCounts.set(feePayer, (feePayerCounts.get(feePayer) ?? 0) + 1);
        }
      } catch {
        // ignore
      }
    });

    const discovered = Array.from(feePayerCounts.entries())
      .filter(([addr, cnt]) => cnt >= minSwaps && isPlausible(addr))
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxWallets)
      .map(([addr]) => addr);

    return NextResponse.json({
      ok: true,
      meta: {
        programs,
        sigCounts,
        days,
        perProgram,
        minSwaps,
        scannedSignatures: uniqueSigs.length,
        uniqueWallets: feePayerCounts.size,
        batchCount: sigChunks.length,
      },
      discovered,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? "Discovery error" },
      { status: 500 }
    );
  }
}

// Batch: getParsedTransactions (liefert array paralleler Antworten)
async function getParsedTransactionsBatch(signatures: string[]) {
  return rpc<
    Array<{
      transaction?: {
        message?: { accountKeys?: Array<string | { pubkey: string }> };
      };
      meta?: any;
    }>
  >({
    jsonrpc: "2.0",
    id: "disc-txs-batch",
    method: "getParsedTransactions",
    params: [
      signatures,
      { maxSupportedTransactionVersion: 0, commitment: "confirmed" },
    ],
  });
}

// utility: in Stücke von n schneiden
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
