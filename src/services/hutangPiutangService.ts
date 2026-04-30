import { auth } from "@/lib/firebase";
import { DanaItems, Hutang, LimitItems, Piutang } from "@/types/hutangPiutang";

type HutangApiPayload = Omit<Hutang, "id">;
type PiutangApiPayload = Omit<Piutang, "id">;

const toIsoDateString = (date: Date) => date.toISOString();

const serializeDanaItem = (item: DanaItems) => ({
  ...item,
  tglPinjam: toIsoDateString(item.tglPinjam),
  tglKembali: toIsoDateString(item.tglKembali),
});

const serializeLimitItem = (item: LimitItems) => ({
  ...item,
  tanggalAwal: toIsoDateString(item.tanggalAwal),
  tanggalMulai: toIsoDateString(item.tanggalMulai),
  tanggalSelesai: toIsoDateString(item.tanggalSelesai),
});

const serializeHutang = (hutang: HutangApiPayload) => ({
  ...hutang,
  tglPinjam: toIsoDateString(hutang.tglPinjam),
  tglKembali: toIsoDateString(hutang.tglKembali),
  createdAt: toIsoDateString(hutang.createdAt),
});

const serializePiutang = (piutang: PiutangApiPayload) => ({
  ...piutang,
  createdAt: toIsoDateString(piutang.createdAt),
  itemsDana: piutang.itemsDana.map(serializeDanaItem),
  itemsLimit: piutang.itemsLimit.map(serializeLimitItem),
});

const parseHutang = (hutang: Hutang): Hutang => ({
  ...hutang,
  tglPinjam: new Date(hutang.tglPinjam),
  tglKembali: new Date(hutang.tglKembali),
  createdAt: new Date(hutang.createdAt),
});

const parsePiutang = (piutang: Piutang): Piutang => ({
  ...piutang,
  createdAt: new Date(piutang.createdAt),
  itemsDana: piutang.itemsDana.map((item) => ({
    ...item,
    tglPinjam: new Date(item.tglPinjam),
    tglKembali: new Date(item.tglKembali),
  })),
  itemsLimit: piutang.itemsLimit.map((item) => ({
    ...item,
    tanggalAwal: new Date(item.tanggalAwal),
    tanggalMulai: new Date(item.tanggalMulai),
    tanggalSelesai: new Date(item.tanggalSelesai),
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

export const addHutang = async (
  userUID: string,
  hutangData: Omit<Hutang, "id">,
  email?: string | null
) => {
  const created = await requestJson<Hutang>("/api/hutang", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      hutang: serializeHutang(hutangData),
    }),
  });

  return created.id ?? "";
};

export const fetchHutang = async (
  userUID: string,
  email?: string | null
): Promise<Hutang[]> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    const result = await requestJson<Hutang[]>(
      `/api/hutang?${searchParams.toString()}`
    );

    return result.map(parseHutang);
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return [];
  }
};

export const updateHutang = async (
  userUID: string,
  hutangId: string,
  data: Partial<Omit<Hutang, "id">>,
  email?: string | null
) => {
  await requestJson<{ success: boolean }>(`/api/hutang/${hutangId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      data: {
        ...data,
        tglPinjam: data.tglPinjam ? toIsoDateString(data.tglPinjam) : undefined,
        tglKembali: data.tglKembali
          ? toIsoDateString(data.tglKembali)
          : undefined,
        createdAt: data.createdAt ? toIsoDateString(data.createdAt) : undefined,
      },
    }),
  });
};

export const deleteHutang = async (userUID: string, hutangId: string) => {
  const searchParams = new URLSearchParams({ firebaseUid: userUID });
  await requestJson<{ success: boolean }>(
    `/api/hutang/${hutangId}?${searchParams.toString()}`,
    {
      method: "DELETE",
    }
  );
};

export const addPiutang = async (
  userUID: string,
  _jenisPiutang: Piutang["jenisPiutang"],
  piutangData: Omit<Piutang, "id">,
  email?: string | null
) => {
  const created = await requestJson<Piutang>("/api/piutang", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      piutang: serializePiutang(piutangData),
    }),
  });

  return created.id ?? "";
};

export const fetchPiutang = async (
  userUID: string,
  email?: string | null
): Promise<Piutang[]> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    const result = await requestJson<Piutang[]>(
      `/api/piutang?${searchParams.toString()}`
    );

    return result.map(parsePiutang);
  } catch (error) {
    console.error("Error fetching piutang:", error);
    return [];
  }
};

export const updatePiutang = async (
  userUID: string,
  _jenisPiutang: Piutang["jenisPiutang"],
  piutangId: string,
  data: Partial<Omit<Piutang, "id">>,
  email?: string | null
) => {
  await requestJson<{ success: boolean }>(`/api/piutang/${piutangId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      data: data
        ? {
            ...data,
            createdAt: data.createdAt
              ? toIsoDateString(data.createdAt)
              : undefined,
            itemsDana: data.itemsDana?.map(serializeDanaItem),
            itemsLimit: data.itemsLimit?.map(serializeLimitItem),
          }
        : undefined,
    }),
  });
};

export const deletePiutang = async (
  userUID: string,
  _jenisPiutang: Piutang["jenisPiutang"],
  piutangId: string
) => {
  const searchParams = new URLSearchParams({ firebaseUid: userUID });
  await requestJson<{ success: boolean }>(
    `/api/piutang/${piutangId}?${searchParams.toString()}`,
    {
      method: "DELETE",
    }
  );
};
