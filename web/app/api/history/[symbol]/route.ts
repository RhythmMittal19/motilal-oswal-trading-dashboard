import { NextResponse } from "next/server";

import { advance, intradaySeries } from "@/lib/simulation";
import type { ApiError } from "@/types/market";

/**
 * GET /api/history/:symbol -> PricePoint[]
 *
 * Separate from /api/market because history is only needed once a stock is
 * selected — polling it alongside every quote would be wasted bandwidth.
 *
 * `params` is a Promise in Next 15+. Awaiting it is required, not optional.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;

  advance();
  const series = intradaySeries(symbol.toUpperCase());

  if (!series) {
    const error: ApiError = {
      code: "SYMBOL_NOT_FOUND",
      message: `No instrument matches "${symbol}".`,
    };
    return NextResponse.json(error, { status: 404 });
  }

  return NextResponse.json(series);
}
