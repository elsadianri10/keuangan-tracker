import { NextRequest, NextResponse } from "next/server";
import { updateTagihanItemInstallmentsForFirebaseUser } from "@/lib/tagihanMySql";
import { TagihanInstallment } from "@/types/tagihan";

type UpdateTagihanInstallmentsRequest = {
  firebaseUid?: string;
  email?: string | null;
  installments?: TagihanInstallment[];
};

const parseTagihanItemId = (value: string) => {
  const tagihanItemId = Number.parseInt(value, 10);
  if (!Number.isFinite(tagihanItemId) || tagihanItemId <= 0) {
    throw new Error("ID item tagihan tidak valid.");
  }
  return tagihanItemId;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const body = (await request.json()) as UpdateTagihanInstallmentsRequest;

    if (!body.firebaseUid || !body.installments) {
      return NextResponse.json(
        { message: "firebaseUid dan data cicilan wajib dikirim." },
        { status: 400 }
      );
    }

    const updated = await updateTagihanItemInstallmentsForFirebaseUser(
      body.firebaseUid,
      body.email,
      parseTagihanItemId(itemId),
      body.installments
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tagihan/item/[itemId]/installments gagal:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui detail cicilan.",
      },
      { status: 500 }
    );
  }
}
