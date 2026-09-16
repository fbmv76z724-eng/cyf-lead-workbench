import type { FollowUp, FollowUpInput } from "../domain/followUp";
import type { Lead, LocalFollowStatus } from "../domain/lead";
import type { LeadFilters } from "./selectors";
import { filterLeads } from "./selectors";

export interface CreateOfflineLeadInput {
  name: string;
  phone: string;
  city: string;
  intentionArea: string;
  channelType: string;
  localStatus: LocalFollowStatus;
  remark?: string;
}

export interface SyncResult {
  processed: number;
  failed: number;
  finishedAt: string;
}

export interface LeadRepository {
  listLeads(filters?: LeadFilters): Lead[];
  getLead(id: string): Lead | undefined;
  getFollowUps(leadId: string): FollowUp[];
  addFollowUp(input: FollowUpInput): Promise<FollowUp>;
  addOfflineLead(input: CreateOfflineLeadInput): Lead;
  sync(): Promise<SyncResult>;
  subscribe(listener: () => void): () => void;
  getSnapshot(): Lead[];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createMockRepository(
  initialLeads: Lead[],
  initialFollowUps: FollowUp[],
): LeadRepository {
  let leads = initialLeads;
  let followUps = initialFollowUps;
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    listLeads(filters) {
      return filters ? filterLeads(leads, filters) : leads;
    },
    getLead(id) {
      return leads.find((lead) => lead.id === id);
    },
    getFollowUps(leadId) {
      return followUps
        .filter((followUp) => followUp.leadId === leadId)
        .sort(
          (a, b) =>
            new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime(),
        );
    },
    async addFollowUp(input) {
      const now = new Date().toISOString();
      const followUp: FollowUp = {
        id: createId("follow"),
        ...input,
        syncState: "pending",
        origin: "local",
      };
      followUps = [followUp, ...followUps];
      leads = leads.map((lead) =>
        lead.id === input.leadId
          ? {
              ...lead,
              latestLinkStatus: input.linkStatus,
              possibleJoin: input.possibleJoin,
              latestFollowAt: input.calledAt,
              latestFollowUser: input.operatorName,
              followCount: lead.followCount + 1,
              syncState: lead.source === "cyf" ? "pending" : "local_only",
              updatedAt: now,
            }
          : lead,
      );
      emit();
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      return followUp;
    },
    addOfflineLead(input) {
      const now = new Date().toISOString();
      const lead: Lead = {
        id: createId("offline"),
        source: "offline",
        city: input.city,
        company: "宁夏和胜昌信息咨询有限公司（西昌）",
        name: input.name,
        phoneMasked: `${input.phone.slice(0, 3)}****${input.phone.slice(-4)}`,
        phoneFull: input.phone,
        flowState: "本地线索",
        leadStage: "线下新增",
        channelType: input.channelType,
        intentionArea: input.intentionArea,
        inCompanyTime: now,
        fallPublicDays: 0,
        possibleJoin: undefined,
        latestLinkStatus: 4,
        followCount: 0,
        syncState: "local_only",
        localStatus: input.localStatus,
        createdAt: now,
        updatedAt: now,
      };
      leads = [lead, ...leads];
      emit();
      return lead;
    },
    async sync() {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      let processed = 0;
      leads = leads.map((lead) => {
        if (lead.syncState !== "pending") return lead;
        processed += 1;
        return { ...lead, syncState: "synced", updatedAt: new Date().toISOString() };
      });
      emit();
      return {
        processed,
        failed: 0,
        finishedAt: new Date().toISOString(),
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return leads;
    },
  };
}
