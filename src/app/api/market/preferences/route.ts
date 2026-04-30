import { NextRequest, NextResponse } from "next/server";
import {
  getMarketPreferencesByFirebaseUid,
  updateMarketPreferencesForFirebaseUser,
} from "@/lib/marketPreferencesMySql";
import { MarketPreferences } from "@/types/market";

type UpdateMarketPreferencesRequest = {
  firebaseUid?: string;
  email?: string | null;
  preferences?: MarketPreferences;
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

    const preferences = await getMarketPreferencesByFirebaseUid(firebaseUid, email);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("GET /api/market/preferences gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat preferensi market." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateMarketPreferencesRequest;

    if (!body.firebaseUid || !body.preferences) {
      return NextResponse.json(
        { message: "firebaseUid dan preferensi market wajib dikirim." },
        { status: 400 }
      );
    }

    const preferences = await updateMarketPreferencesForFirebaseUser(
      body.firebaseUid,
      body.email,
      body.preferences
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("PUT /api/market/preferences gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan preferensi market.",
      },
      { status: 500 }
    );
  }
}
