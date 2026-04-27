import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCRColor(cr: number): string {
  if (cr <= 0.1) return 'text-td-positive';
  if (cr <= 0.2) return 'text-td-warning';
  return 'text-td-danger';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-light-surface text-warm-dark',
    active: 'bg-light-mint text-dark-green',
    closed: 'bg-gray-100 text-td-gray',
    pending: 'bg-yellow-50 text-yellow-700',
    accepted: 'bg-light-mint text-dark-green',
    completed: 'bg-wise-green/20 text-dark-green',
  };
  return map[status] || 'bg-gray-100 text-td-gray';
}
