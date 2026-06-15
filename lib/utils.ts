import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { StageStatus } from "@/lib/types";

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d בMMMM yyyy, HH:mm", { locale: he });
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "d בMMMM yyyy", { locale: he });
}

export const STATUS_LABELS: Record<StageStatus, string> = {
  locked: "נעול",
  upcoming: "עתידי",
  active: "פעיל",
  completed: "הושלם",
};

export const STATUS_COLORS: Record<StageStatus, string> = {
  locked: "text-theme-subtle bg-theme-raised border-theme-border",
  upcoming: "text-theme-muted bg-theme-raised border-theme-border",
  active: "text-black bg-lambo-gold border-lambo-gold",
  completed: "text-lambo-gold-text bg-theme-surface border-lambo-gold/40",
};

export const STATUS_DOT: Record<StageStatus, string> = {
  locked: "bg-theme-subtle",
  upcoming: "bg-theme-muted",
  active: "bg-lambo-gold",
  completed: "bg-lambo-gold-text",
};
