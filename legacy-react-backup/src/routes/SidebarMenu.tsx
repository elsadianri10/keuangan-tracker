import { FileText, HandCoins, LayoutDashboard, Star } from "lucide-react";

export const menuItems = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { path: "/tagihan", label: "Tagihan", icon: <FileText size={18} /> },
  { path: "/hutangpiutang", label: "Hutang & Piutang", icon: <HandCoins size={18} /> },
  { path: "/wishlist", label: "Wishlist", icon: <Star size={18} /> },
];
 