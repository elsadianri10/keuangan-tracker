import { NextRequest, NextResponse } from "next/server";
import { getStockQuotes } from "@/lib/marketData";
import { getStockWatchlistByFirebaseUid } from "@/lib/marketWatchlistMySql";

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.nextUrl.searchParams.get("firebaseUid");
    const email = request.nextUrl.searchParams.get("email");

    if (!firebaseUid) {
      return NextResponse.json(
        { message: "firebaseUid wajib dikirim." },
        { status: 400 }
      );
    }

    const watchlist = await getStockWatchlistByFirebaseUid(firebaseUid, email);
    const quotes = await getStockQuotes(watchlist);

    return NextResponse.json({ watchlist, quotes });
  } catch (error) {
    console.error("GET /api/market/stocks gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat data saham watchlist." },
      { status: 500 }
    );
  }
}
