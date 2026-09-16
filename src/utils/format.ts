import {
  LINK_STATUS_LABELS,
  POSSIBLE_JOIN_LABELS,
  type LinkStatus,
  type PossibleJoin,
} from "../domain/lead";

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatFullDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatLinkStatus(value: LinkStatus): string {
  return LINK_STATUS_LABELS[value];
}

export function formatPossibleJoin(value?: PossibleJoin): string {
  return value === undefined ? "未选择" : POSSIBLE_JOIN_LABELS[value];
}

export function formatLeadOrigin(channelType: string): string {
  const normalized = channelType.trim();
  if (!normalized) return "其他";
  if (normalized === "线上") return "线上";
  if (normalized === "线下") return "线下";
  if (normalized === "门店") return "门店";
  if (normalized === "付费") return "付费";
  if (normalized === "转介绍" || normalized === "司机介绍") {
    return "司机介绍";
  }
  return normalized;
}

export function isSameLocalDay(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function toLocalDateKey(value: string): string {
  return toLocalDateInputKey(value).slice(5);
}

export function toLocalDateInputKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
