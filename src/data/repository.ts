import type { UserProfile } from "../auth/permissions";
import type { FollowUp, FollowUpInput } from "../domain/followUp";
import type { Lead, LocalFollowStatus } from "../domain/lead";
import type { OnboardingRecord } from "../domain/onboarding";
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

export interface CreateAccountInput {
  email: string;
  displayName: string;
  password: string;
  role: UserProfile["role"];
}

export interface SyncResult {
  processed: number;
  failed: number;
  finishedAt: string;
}

export interface LeadRepository {
  load(): Promise<void>;
  listLeads(filters?: LeadFilters): Lead[];
  getLead(id: string): Lead | undefined;
  getFollowUps(leadId: string): FollowUp[];
  getOnboardingRecords(): OnboardingRecord[];
  addFollowUp(input: FollowUpInput): Promise<FollowUp>;
  addOfflineLead(input: CreateOfflineLeadInput): Promise<Lead>;
  claimLead(id: string): Promise<Lead>;
  assignLead(id: string, ownerId: string | null): Promise<Lead>;
  listProfiles(): Promise<UserProfile[]>;
  createAccount(input: CreateAccountInput): Promise<UserProfile>;
  updateProfile(
    id: string,
    changes: Pick<UserProfile, "role" | "active">,
  ): Promise<UserProfile>;
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
  initialOnboardingRecords: OnboardingRecord[] = [],
): LeadRepository {
  let leads = initialLeads;
  let followUps = initialFollowUps;
  const onboardingRecords = initialOnboardingRecords;
  let profiles: UserProfile[] = [];
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    async load() {},
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
    getOnboardingRecords() {
      return onboardingRecords;
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
    async addOfflineLead(input) {
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
    async claimLead(id) {
      const lead = leads.find((item) => item.id === id);
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      if (lead.ownerId) throw new Error("LEAD_ALREADY_CLAIMED");
      const claimedLead = {
        ...lead,
        ownerId: "mock-current-user",
        claimedAt: new Date().toISOString(),
      };
      leads = leads.map((item) => (item.id === id ? claimedLead : item));
      emit();
      return claimedLead;
    },
    async assignLead(id, ownerId) {
      const lead = leads.find((item) => item.id === id);
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      const assignedLead = {
        ...lead,
        ownerId: ownerId ?? undefined,
        claimedAt: ownerId ? new Date().toISOString() : undefined,
      };
      leads = leads.map((item) => (item.id === id ? assignedLead : item));
      emit();
      return assignedLead;
    },
    async listProfiles() {
      return profiles;
    },
    async createAccount(input) {
      const profile: UserProfile = {
        id: createId("profile"),
        displayName: input.displayName,
        role: input.role,
        active: true,
      };
      profiles = [profile, ...profiles];
      return profile;
    },
    async updateProfile(id, changes) {
      const current = profiles.find((profile) => profile.id === id);
      if (!current) throw new Error("PROFILE_NOT_FOUND");
      const profile = { ...current, ...changes };
      profiles = profiles.map((item) => (item.id === id ? profile : item));
      return profile;
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
