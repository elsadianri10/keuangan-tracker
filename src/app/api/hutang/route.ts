import { NextRequest, NextResponse } from "next/server";
import {
  createHutangForFirebaseUser,
  getHutangByFirebaseUid,
} from "@/lib/hutangPiutangMySql";
import { Hutang } from "@/types/hutangPiutang";

type CreateHutangRequest = {
  firebaseUid?: string;
  email?: string | null;
  hutang?: Omit<Hutang, "id">;
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

    const hutang = await getHutangByFirebaseUid(firebaseUid, email);
    return NextResponse.json(hutang);
  } catch (error) {
    console.error("GET /api/hutang gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat data hutang." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateHutangRequest;

    if (!body.firebaseUid || !body.hutang) {
      return NextResponse.json(
        { message: "firebaseUid dan data hutang wajib dikirim." },
        { status: 400 }
      );
    }

    const created = await createHutangForFirebaseUser(
      body.firebaseUid,
      body.email,
      body.hutang
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/hutang gagal:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Gagal menyimpan hutang.",
      },
      { status: 500 }
    );
  }
}
