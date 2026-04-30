import { NextRequest, NextResponse } from "next/server";
import {
  createTagihanForFirebaseUser,
  getTagihanByFirebaseUid,
} from "@/lib/tagihanMySql";
import { TagihanAkun } from "@/types/tagihan";

type CreateTagihanRequest = {
  firebaseUid?: string;
  email?: string | null;
  tagihan?: Omit<TagihanAkun, "id">;
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

    const tagihan = await getTagihanByFirebaseUid(firebaseUid, email);
    return NextResponse.json(tagihan);
  } catch (error) {
    console.error("GET /api/tagihan gagal:", error);
    return NextResponse.json(
      { message: "Gagal memuat data tagihan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateTagihanRequest;

    if (!body.firebaseUid || !body.tagihan) {
      return NextResponse.json(
        { message: "firebaseUid dan data tagihan wajib dikirim." },
        { status: 400 }
      );
    }

    const created = await createTagihanForFirebaseUser(
      body.firebaseUid,
      body.email,
      body.tagihan
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/tagihan gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menyimpan tagihan.",
      },
      { status: 500 }
    );
  }
}
