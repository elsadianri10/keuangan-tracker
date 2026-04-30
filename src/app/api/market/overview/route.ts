import { NextRequest, NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/marketData";
import { getMarketPreferencesByFirebaseUid } from "@/lib/marketPreferencesMySql";

export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.nextUrl.searchParams.get("firebaseUid");
    const email = request.nextUrl.searchParams.get("email");
    const preferences = firebaseUid
      ? await getMarketPreferencesByFirebaseUid(firebaseUid, email)
      : undefined;
    const overview = await getMarketOverview(preferences);
    return NextResponse.json({ overview, preferences });
  } catch (error) {
    console.error("GET /api/market/overview gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat data market overview." },
      { status: 500 }
    );
  }
}
