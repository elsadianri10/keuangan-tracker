import { NextRequest, NextResponse } from "next/server";
import {
  createPiutangForFirebaseUser,
  getPiutangByFirebaseUid,
} from "@/lib/hutangPiutangMySql";
import { Piutang } from "@/types/hutangPiutang";

type CreatePiutangRequest = {
  firebaseUid?: string;
  email?: string | null;
  piutang?: Omit<Piutang, "id">;
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

    const piutang = await getPiutangByFirebaseUid(firebaseUid, email);
    return NextResponse.json(piutang);
  } catch (error) {
    console.error("GET /api/piutang gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat data piutang." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePiutangRequest;

    if (!body.firebaseUid || !body.piutang) {
      return NextResponse.json(
        { message: "firebaseUid dan data piutang wajib dikirim." },
        { status: 400 }
      );
    }

    const created = await createPiutangForFirebaseUser(
      body.firebaseUid,
      body.email,
      body.piutang
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/piutang gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menyimpan piutang.",
      },
      { status: 500 }
    );
  }
}
