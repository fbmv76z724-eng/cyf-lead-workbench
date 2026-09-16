export type LeadSource = "cyf" | "offline";

export type SyncState =
  | "synced"
  | "pending"
  | "conflict"
  | "failed"
  | "local_only";

export type LinkStatus = 0 | 1 | 2 | 3 | 4;
export type PossibleJoin = -1 | 0 | 1 | 2;
export type LocalFollowStatus =
  | "待跟进"
  | "跟进中"
  | "已跟进"
  | "无效"
  | "成交";

export interface Lead {
  id: string;
  source: LeadSource;
  cyfLeadId?: number;
  cyfDriverId?: number;
  city: string;
  company: string;
  name: string;
  phoneMasked: string;
  phoneFull?: string;
  age?: number;
  drivingYears?: number;
  flowState: string;
  leadStage: string;
  channelType: string;
  intentionArea: string;
  driverType?: string;
  inCompanyTime: string;
  fallPublicDays: number;
  possibleJoin?: PossibleJoin;
  latestLinkStatus: LinkStatus;
  latestFollowAt?: string;
  latestFollowUser?: string;
  followCount: number;
  syncState: SyncState;
  localStatus?: LocalFollowStatus;
  createdAt: string;
  updatedAt: string;
}

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  0: "未接通待二呼",
  1: "已接通",
  2: "二呼未接通",
  3: "空号",
  4: "流入后未外呼",
};

export const POSSIBLE_JOIN_LABELS: Record<PossibleJoin, string> = {
  "-1": "未标记",
  0: "无意向",
  1: "意向高",
  2: "意向一般",
};

export const SYNC_STATE_LABELS: Record<SyncState, string> = {
  synced: "已同步",
  pending: "待同步",
  conflict: "有冲突",
  failed: "同步失败",
  local_only: "仅本地",
};
