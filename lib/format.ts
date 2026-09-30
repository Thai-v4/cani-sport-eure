// Formats de dates français, fuseau du club
const TZ = "Europe/Paris";

const dayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const dayShort = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const dayNumber = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: TZ });
const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TZ });
const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: TZ });
const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const fullDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));
const valid = (d: Date) => !Number.isNaN(d.getTime());

export const formatDayLong = (v: string | Date) => (valid(toDate(v)) ? dayLong.format(toDate(v)) : "");
export const formatDayShort = (v: string | Date) => (valid(toDate(v)) ? dayShort.format(toDate(v)) : "");
export const formatDayNumber = (v: string | Date) => (valid(toDate(v)) ? dayNumber.format(toDate(v)) : "");
export const formatMonthShort = (v: string | Date) =>
  valid(toDate(v)) ? monthShort.format(toDate(v)).replace(".", "") : "";
export const formatMonthLong = (v: string | Date) => (valid(toDate(v)) ? monthLong.format(toDate(v)) : "");
export const formatTime = (v: string | Date) => (valid(toDate(v)) ? time.format(toDate(v)).replace(":", " h ") : "");
export const formatFullDate = (v: string | Date) => (valid(toDate(v)) ? fullDate.format(toDate(v)) : "");

// Clé AAAA-MM pour regrouper par mois
export const monthKey = (v: string | Date) => {
  const d = toDate(v);
  return valid(d) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "";
};
