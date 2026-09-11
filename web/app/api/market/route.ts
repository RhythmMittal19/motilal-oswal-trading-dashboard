import { NextResponse, type NextRequest } from "next/server";

import {
  advance,
  indexQuotes,
  marketStatus,
  stockQuotes,
} from "@/lib/simulation";
import type { ApiError, MarketSnapshot } from "@/types/market";

/**
 * GET /api/market -> MarketSnapshot
 *
 * One endpoint returning everything the dashboard renders. Three separate
 * endpoints would mean three loading states that can disagree with each other.
 *
 * Add ?fail=1 to force a 500. That exists so the error state is demonstrable
 * without unplugging anything.
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("fail") === "1") {
    const error: ApiError = {
      code: "UPSTREAM_UNAVAILABLE",
      message: "Market data feed is not responding.",
    };
    return NextResponse.json(error, { status: 500 });
  }

  advance();

  const snapshot: MarketSnapshot = {
    indices: indexQuotes(),
    stocks: stockQuotes(),
    status: marketStatus(),
    asOf: new Date().toISOString(),
  };

  return NextResponse.json(snapshot);
}
