export const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const formatDateLong = (date: any) => {
  if (!date) return "-";

  let parsedDate: Date;

  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === "string" || typeof date === "number") {
    parsedDate = new Date(date);
  } else if (date.seconds) {
    parsedDate = new Date(date.seconds * 1000);
  } else {
    return "-";
  }
  
  if (isNaN(parsedDate.getTime())) return "-"; 

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat("id-ID").format(value);
};

export const parseRupiah = (value: string) => {
  return parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
};
