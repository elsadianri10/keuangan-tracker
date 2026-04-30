import {
  formatDateLong,
  formatRupiah,
  parseRupiah,
} from "./utils/formatUniversal";

test("formats rupiah values consistently", () => {
  expect(formatRupiah(1250000)).toBe("1.250.000");
  expect(parseRupiah("Rp 1.250.000")).toBe(1250000);
});

test("formats long dates for Indonesian locale", () => {
  expect(formatDateLong(new Date("2025-03-19"))).toMatch(/19 Maret 2025/i);
});
