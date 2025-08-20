import { NextResponse } from "next/server";

// Dummy-Daten – später ersetzen wir das mit Helius / eigene Heuristik
const sampleAddresses = [
  "3Xz39WkutAXnKsZ7zimgWJK9fGJPAhghtsZMjePTzeLQ",
  "8xNAp8u4S7QvMxHBJ2y3rxR9Uvt2tS4oP2d2FzXxAAAA",
  "7y4QzW2Q1uE8bKd91sEaA7oZ8r3HkLk2vCwVvBBBBBB",
  "9kLM2h2tPqQaA1bb3wXxZzRr9cCcGgHhJjKkCCCCCCC",
  "5TtRrEeWwQqAaZzXxCcVvBbNnMm123456DDDDDDDDD",
];

export async function GET() {
  // später: Query bei Helius → filtere nach Swap Activity
  return NextResponse.json({
    ok: true,
    discovered: sampleAddresses,
  });
}
