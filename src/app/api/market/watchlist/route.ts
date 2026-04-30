import { NextRequest, NextResponse } from "next/server";
import {
  getStockWatchlistByFirebaseUid,
  replaceStockWatchlistForFirebaseUser,
} from "@/lib/marketWatchlistMySql";
import { StockWatchlistItem } from "@/types/market";

type UpdateWatchlistRequest = {
  firebaseUid?: string;
  email?: string | null;
  items?: StockWatchlistItem[];
};

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

    const items = await getStockWatchlistByFirebaseUid(firebaseUid, email);
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/market/watchlist gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat watchlist saham." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateWatchlistRequest;

    if (!body.firebaseUid || !body.items) {
      return NextResponse.json(
        { message: "firebaseUid dan daftar saham wajib dikirim." },
        { status: 400 }
      );
    }

    const items = await replaceStockWatchlistForFirebaseUser(
      body.firebaseUid,
      body.email,
      body.items
    );

    return NextResponse.json(items);
  } catch (error) {
    console.error("PUT /api/market/watchlist gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan watchlist saham.",
      },
      { status: 500 }
    );
  }
}
