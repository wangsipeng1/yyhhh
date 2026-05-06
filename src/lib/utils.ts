import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FONTS = [
  { name: "默认黑体", value: "sans-serif" },
  { name: "经典宋体", value: "serif" },
  { name: "等宽字体", value: "monospace" },
  { name: "手写圆体", value: "cursive" },
  { name: "夸张海报", value: "fantasy" },
];

export const COLORS = [
  { name: "墨黑", value: "#1a1a1a" },
  { name: "橄榄", value: "#5a5a40" },
  { name: "棕褐", value: "#8b4513" },
  { name: "赭石", value: "#d2691e" },
  { name: "石板", value: "#708090" },
];

export const BG_PRESETS = [
  { name: "原色", value: "#fffbeb" },
  { name: "黑夜", value: "#3f3f38" },
  { name: "护眼", value: "#e6efd8" },
];

export const SIZES = [
  { name: "超小", value: "12px" },
  { name: "小号", value: "16px" },
  { name: "中号", value: "20px" },
  { name: "大号", value: "28px" },
  { name: "特大", value: "36px" },
  { name: "超大", value: "48px" },
];
