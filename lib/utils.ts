import { format } from "date-fns";
import { he } from "date-fns/locale";

export function formatDate(iso: string): string {
  return format(new Date(iso), "d בMMMM yyyy", { locale: he });
}
