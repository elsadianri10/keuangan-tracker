import { db } from "./firebase";
import { DanaItems, Hutang, LimitItems, Piutang } from "../models/hutangPiutang";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number"
  ) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const normalizeJenisPiutang = (value: string): Piutang["jenisPiutang"] =>
  value === "Limit Pay Later" ? "Limit Pay Later" : "Dana Pribadi";

const mapDanaItems = (items: DanaItems[] = []): DanaItems[] =>
  items.map((item) => ({
    ...item,
    tglPinjam: parseDate(item.tglPinjam),
    tglKembali: parseDate(item.tglKembali),
  }));

const mapLimitItems = (items: LimitItems[] = []): LimitItems[] =>
  items.map((item) => ({
    ...item,
    tanggalAwal: parseDate(item.tanggalAwal),
    tanggalMulai: parseDate(item.tanggalMulai),
    tanggalSelesai: parseDate(item.tanggalSelesai),
  }));

export const addHutang = async (
  userUID: string,
  hutangData: Omit<Hutang, "id">
) => {
  const hutangRef = collection(db, "users", userUID, "hutang");
  const docRef = await addDoc(hutangRef, hutangData);
  return docRef.id;
};

export const fetchHutang = async (userUID: string): Promise<Hutang[]> => {
  try {
    const hutangRef = collection(db, "users", userUID, "hutang");
    const hutangSnapshot = await getDocs(hutangRef);

    return hutangSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        namaKreditur: data.namaKreditur,
        keteranganPinjam: data.keteranganPinjam,
        nominalPinjam: data.nominalPinjam,
        tglPinjam:
          data.tglPinjam instanceof Timestamp
            ? data.tglPinjam.toDate()
            : parseDate(data.tglPinjam),
        tglKembali:
          data.tglKembali instanceof Timestamp
            ? data.tglKembali.toDate()
            : parseDate(data.tglKembali),
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : parseDate(data.createdAt),
      } as Hutang;
    });
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return [];
  }
};

export const updateHutang = async (
  userUID: string,
  hutangId: string,
  data: Partial<Omit<Hutang, "id">>
) => {
  const hutangRef = doc(db, "users", userUID, "hutang", hutangId);
  await updateDoc(hutangRef, data);
};

export const deleteHutang = async (userUID: string, hutangId: string) => {
  const hutangRef = doc(db, "users", userUID, "hutang", hutangId);
  await deleteDoc(hutangRef);
};

export const addPiutang = async (
  userUID: string,
  jenisPiutang: Piutang["jenisPiutang"],
  piutangData: Omit<Piutang, "id">
) => {
  const jenisRef = doc(db, "users", userUID, "piutang", jenisPiutang);
  await setDoc(jenisRef, { jenisPiutang, updatedAt: new Date() }, { merge: true });

  const piutangRef = collection(jenisRef, "items");
  const docRef = await addDoc(piutangRef, piutangData);
  return docRef.id;
};

export const fetchPiutang = async (userUID: string): Promise<Piutang[]> => {
  try {
    const piutangJenisRef = collection(db, "users", userUID, "piutang");
    const jenisSnapshot = await getDocs(piutangJenisRef);
    const fetchedData: Piutang[] = [];

    for (const jenisDoc of jenisSnapshot.docs) {
      const jenisPiutang = normalizeJenisPiutang(jenisDoc.id);
      const itemsRef = collection(jenisDoc.ref, "items");
      const itemsSnapshot = await getDocs(itemsRef);

      itemsSnapshot.forEach((itemDoc) => {
        const data = itemDoc.data();

        fetchedData.push({
          id: itemDoc.id,
          jenisPiutang,
          namaDebitur: data.namaDebitur,
          asalDana: data.asalDana ?? "",
          customDana: data.customDana ?? "",
          asalLimit: data.asalLimit ?? "",
          customLimit: data.customLimit ?? "",
          pembukuan: data.pembukuan ?? 0,
          jatuhTempo: data.jatuhTempo ?? 0,
          createdAt: parseDate(data.createdAt),
          itemsDana: mapDanaItems(data.itemsDana),
          itemsLimit: mapLimitItems(data.itemsLimit),
        });
      });
    }

    return fetchedData;
  } catch (error) {
    console.error("Error fetching piutang:", error);
    return [];
  }
};

export const updatePiutang = async (
  userUID: string,
  jenisPiutang: Piutang["jenisPiutang"],
  piutangId: string,
  data: Partial<Omit<Piutang, "id">>
) => {
  const piutangRef = doc(
    db,
    "users",
    userUID,
    "piutang",
    jenisPiutang,
    "items",
    piutangId
  );

  await updateDoc(piutangRef, data);
};

export const deletePiutang = async (
  userUID: string,
  jenisPiutang: Piutang["jenisPiutang"],
  piutangId: string
) => {
  const piutangRef = doc(
    db,
    "users",
    userUID,
    "piutang",
    jenisPiutang,
    "items",
    piutangId
  );

  await deleteDoc(piutangRef);
};
