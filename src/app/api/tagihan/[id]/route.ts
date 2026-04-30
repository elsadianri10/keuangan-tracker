import { NextRequest, NextResponse } from "next/server";
import {
  deleteTagihanForFirebaseUser,
  updateTagihanForFirebaseUser,
} from "@/lib/tagihanMySql";
import { TagihanAkun, TagihanItem } from "@/types/tagihan";

type UpdateTagihanRequest = {
  firebaseUid?: string;
  email?: string | null;
  data?: Partial<Omit<TagihanAkun, "id" | "items">>;
  items?: TagihanItem[];
};

const parseTagihanId = (value: string) => {
  const tagihanId = Number.parseInt(value, 10);
  if (!Number.isFinite(tagihanId) || tagihanId <= 0) {
    throw new Error("ID tagihan tidak valid.");
  }
  return tagihanId;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateTagihanRequest;

    if (!body.firebaseUid || !body.data) {
      return NextResponse.json(
        { message: "firebaseUid dan data update wajib dikirim." },
        { status: 400 }
      );
    }

    await updateTagihanForFirebaseUser(
      body.firebaseUid,
      body.email,
      parseTagihanId(id),
      body.data,
      body.items
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/tagihan/[id] gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui tagihan.",
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

    await deleteTagihanForFirebaseUser(firebaseUid, parseTagihanId(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tagihan/[id] gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus tagihan.",
      },
      { status: 500 }
    );
  }
}
