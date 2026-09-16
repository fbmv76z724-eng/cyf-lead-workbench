import type { Lead, LinkStatus, PossibleJoin } from "../domain/lead";
import { isSameLocalDay, toLocalDateKey } from "../utils/format";

export interface LeadFilters {
  search: string;
  source: "all" | "cyf" | "offline";
  city: string;
  stage: string;
  linkStatus: "all" | LinkStatus;
  possibleJoin: "all" | PossibleJoin;
  syncState: "all" | Lead["syncState"];
  localStatus: "all" | NonNullable<Lead["localStatus"]>;
}

export const emptyLeadFilters: LeadFilters = {
  search: "",
  source: "all",
  city: "all",
  stage: "all",
  linkStatus: "all",
  possibleJoin: "all",
  syncState: "all",
  localStatus: "all",
};

export interface FunnelPoint {
  label: string;
  count: number;
}

export interface TrendPoint {
  label: string;
  inflow: number;
  calls: number;
}

export interface DashboardMetrics {
  todayInflow: number;
  waitingForCall: number;
  calledToday: number;
  connectedToday: number;
  offlineWaiting: number;
  syncIssues: number;
  funnel: FunnelPoint[];
  trend: TrendPoint[];
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const term = filters.search.trim().toLowerCase();
  return leads.filter((lead) => {
    const matchesSearch =
      !term ||
      lead.cyfDriverId?.toString().includes(term) ||
      lead.phoneMasked.toLowerCase().includes(term) ||
      lead.name.toLowerCase().includes(term) ||
      lead.intentionArea.toLowerCase().includes(term);

    return (
      matchesSearch &&
      (filters.source === "all" || lead.source === filters.source) &&
      (filters.city === "all" || lead.city === filters.city) &&
      (filters.stage === "all" || lead.leadStage === filters.stage) &&
      (filters.linkStatus === "all" ||
        lead.latestLinkStatus === filters.linkStatus) &&
      (filters.possibleJoin === "all" ||
        lead.possibleJoin === filters.possibleJoin) &&
      (filters.syncState === "all" || lead.syncState === filters.syncState) &&
      (filters.localStatus === "all" ||
        lead.localStatus === filters.localStatus)
    );
  });
}

export function getDashboardMetrics(
  leads: Lead[],
  now = new Date(),
): DashboardMetrics {
  const cyfLeads = leads.filter((lead) => lead.source === "cyf");
  const todayInflow = cyfLeads.filter((lead) =>
    isSameLocalDay(lead.inCompanyTime, now),
  ).length;
  const waitingForCall = cyfLeads.filter(
    (lead) => lead.latestLinkStatus === 4,
  ).length;
  const calledToday = cyfLeads.filter((lead) =>
    isSameLocalDay(lead.latestFollowAt, now),
  ).length;
  const connectedToday = cyfLeads.filter(
    (lead) =>
      lead.latestLinkStatus === 1 &&
      isSameLocalDay(lead.latestFollowAt, now),
  ).length;
  const offlineWaiting = leads.filter(
    (lead) =>
      lead.source === "offline" &&
      (lead.localStatus === "待跟进" || lead.localStatus === "跟进中"),
  ).length;
  const syncIssues = leads.filter(
    (lead) =>
      lead.syncState === "conflict" || lead.syncState === "failed",
  ).length;

  const funnel = [
    {
      label: "未外呼",
      count: cyfLeads.filter((lead) => lead.latestLinkStatus === 4).length,
    },
    {
      label: "待二呼",
      count: cyfLeads.filter((lead) => lead.latestLinkStatus === 0).length,
    },
    {
      label: "已接通",
      count: cyfLeads.filter((lead) => lead.latestLinkStatus === 1).length,
    },
    {
      label: "二呼未接通",
      count: cyfLeads.filter((lead) => lead.latestLinkStatus === 2).length,
    },
    {
      label: "空号",
      count: cyfLeads.filter((lead) => lead.latestLinkStatus === 3).length,
    },
  ];

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
    return {
      label: key,
      inflow: cyfLeads.filter(
        (lead) => toLocalDateKey(lead.inCompanyTime) === key,
      ).length,
      calls: cyfLeads.filter(
        (lead) => lead.latestFollowAt && toLocalDateKey(lead.latestFollowAt) === key,
      ).length,
    };
  });

  return {
    todayInflow,
    waitingForCall,
    calledToday,
    connectedToday,
    offlineWaiting,
    syncIssues,
    funnel,
    trend,
  };
}
