// Robuster Helius-Wrapper mit GET->POST Fallback und Adress-Validierung

const BASE = "https://api.helius.xyz/v0";

// sehr einfache Solana-Address-Validierung (Base58, 32–44 Zeichen)
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
function isPlausibleSolAddress(addr: string) {
  const a = addr.trim();
  return a.length >= 32 && a.length <= 44 && BASE58.test(a);
}

export type EnhancedTx = {
  signature: string;
  timestamp: number; // unix sec
  type: string; // "SWAP" | ...
  events?: {
    swap?: Array<{
      tokenTransfers?: Array<{
        mint?: string;
        tokenAmount?: number;
        fromUserAccount?: string;
        toUserAccount?: string;
      }>;
    }>;
  };
};

export async function fetchAddressTxs(
  rawAddress: string,
  start: number, // unix sec
  end: number, // unix sec
  apiKey: string,
  maxTx = 1000
): Promise<EnhancedTx[]> {
  const address = rawAddress.trim();

  if (!apiKey) throw new Error("Missing HELIUS_API_KEY");
  if (!isPlausibleSolAddress(address)) {
    throw new Error(`Invalid Solana address (after trim): "${address}"`);
  }
  if (!(start > 0 && end > start)) {
    throw new Error(`Invalid time window: start=${start}, end=${end}`);
  }

  // --- 1) Versuch: GET pro Adresse (einfachster Pfad) ---
  const getUrl =
    `${BASE}/addresses/${encodeURIComponent(address)}` +
    `/transactions?api-key=${encodeURIComponent(apiKey)}` +
    `&startTime=${start}&endTime=${end}&maxTx=${maxTx}&includeEvents=true`;

  let res = await fetch(getUrl, { cache: "no-store", next: { revalidate: 0 } });
  if (res.ok) {
    const data = (await res.json()) as EnhancedTx[];
    return data.filter((tx) => tx.type === "SWAP");
  } else {
    const text = await res.text();
    // Nur wenn es nach Adresse klingt, probieren wir den Batch-POST als Fallback
    // --- 2) Versuch: POST Batch ---
    const postUrl = `${BASE}/addresses/transactions?api-key=${encodeURIComponent(
      apiKey
    )}`;
    const body = {
      addresses: [address],
      startTime: start,
      endTime: end,
      limit: maxTx, // manche Dokus nennen das "limit"
      maxTx, // und manche "maxTx" – wir geben beides mit, ist idempotent
      includeEvents: true,
      commitment: "finalized",
    };

    res = await fetch(postUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text2 = await res.text();
      throw new Error(
        [
          "Helius request failed.",
          `GET ${
            res.status !== 200 ? "(prev GET status not OK)" : ""
          }: ${getUrl}`,
          `GET body(empty) -> response: ${text}`,
          `POST url: ${postUrl}`,
          `POST body: ${JSON.stringify(body)}`,
          `POST response: ${text2}`,
        ].join("\n")
      );
    }

    // Batch-Response kann je nach Version Array-Formen haben
    const data = (await res.json()) as Array<
      EnhancedTx[] | { transactions: EnhancedTx[] }
    >;
    let txs: EnhancedTx[] = [];
    for (const entry of data) {
      if (Array.isArray(entry)) txs = txs.concat(entry);
      else if (entry && "transactions" in entry)
        txs = txs.concat(entry.transactions);
    }
    return txs.filter((tx) => tx.type === "SWAP");
  }
}
