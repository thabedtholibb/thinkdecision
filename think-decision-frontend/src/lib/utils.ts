import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-600 bg-yellow-50";
  if (rank === 2) return "text-slate-500 bg-slate-50";
  if (rank === 3) return "text-orange-600 bg-orange-50";
  return "text-gray-500 bg-gray-50";
}
