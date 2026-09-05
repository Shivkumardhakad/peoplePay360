import type { StatusBadgeTone } from "@/components/status-badge";

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatHours(minutes?: number | null) {
  return `${((minutes ?? 0) / 60).toFixed(2)}h`;
}

export function humanizeStatus(value?: string | null) {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function statusTone(status?: string | null): StatusBadgeTone {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PRESENT":
    case "REMOTE":
      return "success";
    case "SUBMITTED":
    case "DRAFT":
    case "LATE":
    case "HALF_DAY":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
    case "ABSENT":
    case "EXCEPTION":
    case "TERMINATED":
      return "danger";
    default:
      return "neutral";
  }
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
