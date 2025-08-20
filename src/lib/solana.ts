// sehr einfache Solana-Address-Validierung (Base58, 32–44 Zeichen)
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
export function isPlausibleSolAddress(addr: string) {
  const a = addr.trim();
  return a.length >= 32 && a.length <= 44 && BASE58.test(a);
}
