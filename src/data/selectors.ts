import type { Lead, LinkStatus, PossibleJoin } from "../domain/lead";
import type { OnboardingRecord } from "../domain/onboarding";
import {
  isSameLocalDay,
  toLocalDateInputKey,
  toLocalDateKey,
} from "../utils/format";

export type LeadOrigin =
  | "online"
  | "offline"
  | "referral"
  | "paid"
  | "other";

export interface LeadFilters {
  search: string;
  source: "all" | "cyf" | "offline";
  origin: "all" | LeadOrigin;
  city: string;
  stage: string;
  linkStatus: "all" | LinkStatus;
  possibleJoin: "all" | PossibleJoin;
  syncState: "all" | Lead["syncState"];
  localStatus: "all" | NonNullable<Lead["localStatus"]>;
  dateFrom: string;
  dateTo: string;
}

export const emptyLeadFilters: LeadFilters = {
  search: "",
  source: "all",
  origin: "all",
  city: "all",
  stage: "all",
  linkStatus: "all",
  possibleJoin: "all",
  syncState: "all",
  localStatus: "all",
  dateFrom: "",
  dateTo: "",
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

export interface PeriodMetrics {
  inflow: number;
  onboarded: number;
  onboarding: OnboardingMetrics;
  conversionRate: number;
  calls: number;
}

export interface OnboardingMetrics {
  total: number;
  didi: number;
  xinju: number;
  newDrivers: number;
}

export interface PeriodComparisonMetrics {
  today: PeriodMetrics;
  thisWeek: PeriodMetrics;
  lastWeek: PeriodMetrics;
  thisMonth: PeriodMetrics;
}

export function getLeadOrigin(channelType: string): LeadOrigin {
  const normalized = channelType.trim();

  if (normalized === "线上") return "online";
  if (normalized === "线下" || normalized === "门店") return "offline";
  if (normalized === "转介绍" || normalized === "司机介绍") {
    return "referral";
  }
  if (normalized === "付费") return "paid";
  return "other";
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const term = filters.search.trim().toLowerCase();
  return leads.filter((lead) => {
    const phoneSearch = [lead.phoneMasked, lead.phoneFull]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      !term ||
      lead.cyfDriverId?.toString().includes(term) ||
      phoneSearch.includes(term) ||
      lead.name.toLowerCase().includes(term) ||
      lead.intentionArea.toLowerCase().includes(term);
    const inflowDate = toLocalDateInputKey(lead.inCompanyTime);

    return (
      matchesSearch &&
      (filters.source === "all" || lead.source === filters.source) &&
      (filters.origin === "all" ||
        getLeadOrigin(lead.channelType) === filters.origin) &&
      (filters.city === "all" || lead.city === filters.city) &&
      (filters.stage === "all" || lead.leadStage === filters.stage) &&
      (filters.linkStatus === "all" ||
        lead.latestLinkStatus === filters.linkStatus) &&
      (filters.possibleJoin === "all" ||
        lead.possibleJoin === filters.possibleJoin) &&
      (filters.syncState === "all" || lead.syncState === filters.syncState) &&
      (filters.localStatus === "all" ||
        lead.localStatus === filters.localStatus) &&
      (!filters.dateFrom || inflowDate >= filters.dateFrom) &&
      (!filters.dateTo || inflowDate <= filters.dateTo)
    );
  });
}

export function getPeriodComparisonMetrics(
  leads: Lead[],
  onboardingRecords: OnboardingRecord[],
  now = new Date(),
): PeriodComparisonMetrics {
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = addLocalDays(todayStart, 1);
  const thisWeekStart = startOfLocalWeek(now);
  const nextWeekStart = addLocalDays(thisWeekStart, 7);
  const lastWeekStart = addLocalDays(thisWeekStart, -7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    today: getPeriodMetrics(
      leads,
      onboardingRecords,
      todayStart,
      tomorrowStart,
    ),
    thisWeek: getPeriodMetrics(
      leads,
      onboardingRecords,
      thisWeekStart,
      nextWeekStart,
    ),
    lastWeek: getPeriodMetrics(
      leads,
      onboardingRecords,
      lastWeekStart,
      thisWeekStart,
    ),
    thisMonth: getPeriodMetrics(
      leads,
      onboardingRecords,
      thisMonthStart,
      nextMonthStart,
    ),
  };
}

function getPeriodMetrics(
  leads: Lead[],
  onboardingRecords: OnboardingRecord[],
  start: Date,
  end: Date,
): PeriodMetrics {
  const cyfLeads = leads.filter((lead) => lead.source === "cyf");
  const inflow = cyfLeads.filter((lead) =>
    isWithinPeriod(lead.inCompanyTime, start, end),
  ).length;
  const onboardedRecords = onboardingRecords.filter((record) =>
    isWithinPeriod(record.onboardedAt, start, end),
  );
  const onboarding: OnboardingMetrics = {
    total: onboardedRecords.length,
    didi: onboardedRecords.filter((record) => record.identity === "didi").length,
    xinju: onboardedRecords.filter((record) => record.identity === "xinju")
      .length,
    newDrivers: onboardedRecords.filter(
      (record) => record.driverType === "纯新",
    ).length,
  };
  const calls = cyfLeads.filter(
    (lead) =>
      lead.latestFollowAt &&
      isWithinPeriod(lead.latestFollowAt, start, end),
  ).length;

  return {
    inflow,
    onboarded: onboarding.total,
    onboarding,
    conversionRate:
      inflow === 0 ? 0 : Math.round((onboarding.total / inflow) * 1000) / 10,
    calls,
  };
}

function isWithinPeriod(value: string, start: Date, end: Date): boolean {
  const timestamp = new Date(value).getTime();
  return timestamp >= start.getTime() && timestamp < end.getTime();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalWeek(date: Date): Date {
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return addLocalDays(startOfLocalDay(date), -offset);
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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
