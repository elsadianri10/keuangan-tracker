import { db } from "./firebase";
import { TagihanAkun, TagihanItem } from "../models/tagihan";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  // setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export const addTagihan = async (
  userUID: string,
  tagihanData: Omit<TagihanAkun, "id" | "items">
) => {
  try {
    const tagihanRef = collection(db, "users", userUID, "tagihan");
    const docRef = await addDoc(tagihanRef, tagihanData);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const addTagihanItem = async (
  userUID: string,
  tagihanId: string,
  itemData: TagihanItem
) => {
  try {
    const itemRef = collection(
      db,
      "users",
      userUID,
      "tagihan",
      tagihanId,
      "items"
    );
    await addDoc(itemRef, itemData);
  } catch (error) {
    throw error;
  }
};

export const fetchTagihanWithItems = async (
  userUID: string
): Promise<TagihanAkun[]> => {
  const tagihanList: TagihanAkun[] = [];

  try {
    const tagihanAkunRef = collection(db, "users", userUID, "tagihan");
    const tagihanSnapshot = await getDocs(tagihanAkunRef);

    for (const tagihanDoc of tagihanSnapshot.docs) {
      const tagihanData = tagihanDoc.data();
      const tagihanAkunId = tagihanDoc.id;

      // Ambil items (subcollection)
      const itemsRef = collection(
        db,
        "users",
        userUID,
        "tagihan",
        tagihanAkunId,
        "items"
      );
      const itemsSnapshot = await getDocs(itemsRef);

      const items: TagihanItem[] = itemsSnapshot.docs.map((itemDoc) => {
        const itemData = itemDoc.data();

        return {
          id: itemDoc.id,
          keterangan: itemData.keterangan,
          tenor: itemData.tenor,
          bulanCicilanPertama:
            itemData.bulanCicilanPertama instanceof Timestamp
              ? itemData.bulanCicilanPertama.toDate()
              : new Date(itemData.bulanCicilanPertama),
          bulanCicilanTerakhir:
            itemData.bulanCicilanTerakhir instanceof Timestamp
              ? itemData.bulanCicilanTerakhir.toDate()
              : new Date(itemData.bulanCicilanTerakhir),
          nominal: itemData.nominal,
        };
      });

      tagihanList.push({
        id: tagihanAkunId,
        namaAkun: tagihanData.namaAkun,
        customAkun: tagihanData.customAkun,
        pembukuan: tagihanData.pembukuan,
        jatuhTempo: tagihanData.jatuhTempo,
        biayaAdmin: tagihanData.biayaAdmin,
        createdAt : tagihanData.createdAt,
        items,
      });
    }

    return tagihanList;
  } catch (error) {
    return [];
  }
};

export const updateTagihan = async (
  userUID: string,
  tagihanId: string,
  data: Partial<Omit<TagihanAkun, "id" | "items">>,
  items?: TagihanItem[]
) => {
  try {
    if (!tagihanId) throw new Error("ID Tagihan tidak ditemukan");

    const tagihanRef = doc(db, "users", userUID, "tagihan", tagihanId);
    const itemsRef = collection(tagihanRef, "items");

    const batch = writeBatch(db);

    // Update data akun utama (hanya data yang diberikan, tidak overwrite semuanya)
    await updateDoc(tagihanRef, data);

    if (items) {
      // Hapus semua item lama sebelum menyimpan yang baru
      const existingItems = await getDocs(itemsRef);

      if (!existingItems.empty) {
        existingItems.forEach((item) => {
          batch.delete(item.ref);
        });
      }

      // Tambah item baru dalam satu batch
      items.forEach((item) => {
        const newItemRef = doc(itemsRef); // Buat referensi dokumen baru
        batch.set(newItemRef, item);
      });
    }

    // Commit batch untuk menghindari banyak request Firestore
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

export const deleteTagihan = async (userUID: string, tagihanId: string) => {
  try {
    const itemsRef = collection(
      db,
      "users",
      userUID,
      "tagihan",
      tagihanId,
      "items"
    );
    const itemsSnap = await getDocs(itemsRef);
    const batch = writeBatch(db);
    itemsSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await deleteDoc(doc(db, "users", userUID, "tagihan", tagihanId));
  } catch (error) {
    throw error;
  }
};
