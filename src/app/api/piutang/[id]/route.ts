import { NextRequest, NextResponse } from "next/server";
import {
  deletePiutangForFirebaseUser,
  updatePiutangForFirebaseUser,
} from "@/lib/hutangPiutangMySql";
import { Piutang } from "@/types/hutangPiutang";

type UpdatePiutangRequest = {
  firebaseUid?: string;
  email?: string | null;
  data?: Partial<Omit<Piutang, "id">>;
};

const parsePiutangId = (value: string) => {
  const piutangId = Number.parseInt(value, 10);
  if (!Number.isFinite(piutangId) || piutangId <= 0) {
    throw new Error("ID piutang tidak valid.");
  }
  return piutangId;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdatePiutangRequest;

    if (!body.firebaseUid || !body.data) {
      return NextResponse.json(
        { message: "firebaseUid dan data update wajib dikirim." },
        { status: 400 }
      );
    }

    await updatePiutangForFirebaseUser(
      body.firebaseUid,
      body.email,
      parsePiutangId(id),
      body.data
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/piutang/[id] gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal memperbarui piutang.",
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

    await deletePiutangForFirebaseUser(firebaseUid, parsePiutangId(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/piutang/[id] gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus piutang.",
      },
      { status: 500 }
    );
  }
}
