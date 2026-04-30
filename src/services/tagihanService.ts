import { auth } from "@/lib/firebase";
import {
  TagihanAkun,
  TagihanInstallment,
  TagihanItem,
} from "@/types/tagihan";

type TagihanApiPayload = Omit<TagihanAkun, "id">;

const toIsoDateString = (date: Date) => date.toISOString();

const serializeTagihanItem = (item: TagihanItem) => ({
  ...item,
  bulanCicilanPertama: toIsoDateString(item.bulanCicilanPertama),
  bulanCicilanTerakhir: toIsoDateString(item.bulanCicilanTerakhir),
  installments: item.installments?.map((installment) => ({
    ...installment,
    paidAt: installment.paidAt ? toIsoDateString(installment.paidAt) : null,
  })),
});

const serializeTagihan = (tagihan: TagihanApiPayload) => ({
  ...tagihan,
  createdAt: toIsoDateString(tagihan.createdAt),
  items: tagihan.items.map(serializeTagihanItem),
});

const parseTagihan = (tagihan: TagihanAkun): TagihanAkun => ({
  ...tagihan,
  createdAt: new Date(tagihan.createdAt),
  items: tagihan.items.map((item) => ({
    ...item,
    bulanCicilanPertama: new Date(item.bulanCicilanPertama),
    bulanCicilanTerakhir: new Date(item.bulanCicilanTerakhir),
    installments:
      item.installments?.map((installment) => ({
        ...installment,
        paidAt: installment.paidAt ? new Date(installment.paidAt) : null,
      })) ?? [],
  })),
});

const getCurrentUserEmail = (fallback?: string | null) =>
  auth.currentUser?.email ?? fallback ?? null;

const requestJson = async <T>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "Request gagal diproses.";
    throw new Error(message);
  }

  return data as T;
};

export const addTagihan = async (
  userUID: string,
  tagihanData: Omit<TagihanAkun, "id" | "items">,
  items: TagihanItem[],
  email?: string | null
) => {
  const created = await requestJson<TagihanAkun>("/api/tagihan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      tagihan: serializeTagihan({
        ...tagihanData,
        items,
      }),
    }),
  });

  return created.id ?? "";
};

export const fetchTagihanWithItems = async (
  userUID: string,
  email?: string | null
): Promise<TagihanAkun[]> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    const result = await requestJson<TagihanAkun[]>(
      `/api/tagihan?${searchParams.toString()}`
    );

    return result.map(parseTagihan);
  } catch (error) {
    console.error("Error fetching tagihan:", error);
    return [];
  }
};

export const updateTagihan = async (
  userUID: string,
  tagihanId: string,
  data: Partial<Omit<TagihanAkun, "id" | "items">>,
  items?: TagihanItem[],
  email?: string | null
) => {
  await requestJson<{ success: boolean }>(`/api/tagihan/${tagihanId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      data: {
        ...data,
        createdAt: data.createdAt ? toIsoDateString(data.createdAt) : undefined,
      },
      items: items?.map(serializeTagihanItem),
    }),
  });
};

export const deleteTagihan = async (userUID: string, tagihanId: string) => {
  const searchParams = new URLSearchParams({ firebaseUid: userUID });
  await requestJson<{ success: boolean }>(
    `/api/tagihan/${tagihanId}?${searchParams.toString()}`,
    {
      method: "DELETE",
    }
  );
};

export const updateTagihanItemInstallments = async (
  userUID: string,
  tagihanItemId: string,
  installments: TagihanInstallment[],
  email?: string | null
) => {
  const updated = await requestJson<TagihanItem>(
    `/api/tagihan/item/${tagihanItemId}/installments`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firebaseUid: userUID,
        email: getCurrentUserEmail(email),
        installments: installments.map((installment) => ({
          ...installment,
          paidAt: installment.paidAt ? toIsoDateString(installment.paidAt) : null,
        })),
      }),
    }
  );

  return {
    ...updated,
    bulanCicilanPertama: new Date(updated.bulanCicilanPertama),
    bulanCicilanTerakhir: new Date(updated.bulanCicilanTerakhir),
    installments:
      updated.installments?.map((installment) => ({
        ...installment,
        paidAt: installment.paidAt ? new Date(installment.paidAt) : null,
      })) ?? [],
  } satisfies TagihanItem;
};
