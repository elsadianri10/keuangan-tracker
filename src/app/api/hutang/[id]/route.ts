import { NextRequest, NextResponse } from "next/server";
import {
  deleteHutangForFirebaseUser,
  updateHutangForFirebaseUser,
} from "@/lib/hutangPiutangMySql";
import { Hutang } from "@/types/hutangPiutang";

type UpdateHutangRequest = {
  firebaseUid?: string;
  email?: string | null;
  data?: Partial<Omit<Hutang, "id">>;
};

const parseHutangId = (value: string) => {
  const hutangId = Number.parseInt(value, 10);
  if (!Number.isFinite(hutangId) || hutangId <= 0) {
    throw new Error("ID hutang tidak valid.");
  }
  return hutangId;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateHutangRequest;

    if (!body.firebaseUid || !body.data) {
      return NextResponse.json(
        { message: "firebaseUid dan data update wajib dikirim." },
        { status: 400 }
      );
    }

    await updateHutangForFirebaseUser(
      body.firebaseUid,
      body.email,
      parseHutangId(id),
      body.data
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/hutang/[id] gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal memperbarui hutang.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const firebaseUid = request.nextUrl.searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return NextResponse.json(
        { message: "firebaseUid wajib dikirim." },
        { status: 400 }
      );
    }

    await deleteHutangForFirebaseUser(firebaseUid, parseHutangId(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/hutang/[id] gagal:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Gagal menghapus hutang.",
      },
      { status: 500 }
    );
  }
}
