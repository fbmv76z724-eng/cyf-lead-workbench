import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "../auth/permissions";
import type { FollowUp, FollowUpInput } from "../domain/followUp";
import type {
  Lead,
  LinkStatus,
  LocalFollowStatus,
  PossibleJoin,
  SyncState,
} from "../domain/lead";
import type { OnboardingRecord } from "../domain/onboarding";
import {
  type CreateAccountInput,
  type CreateOfflineLeadInput,
  type LeadRepository,
  type UpdateAccountInput,
} from "./repository";
import { filterLeads } from "./selectors";

type Row = Record<string, unknown>;

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

export function mapLeadRow(row: Row): Lead {
  return {
    id: String(row.id),
    source: row.source === "offline" ? "offline" : "cyf",
    cyfLeadId: optionalNumber(row.cyf_lead_id),
    cyfDriverId: optionalNumber(row.cyf_driver_id),
    city: String(row.city ?? ""),
    company: String(row.company ?? ""),
    name: String(row.name ?? ""),
    phoneMasked: String(row.phone_masked ?? ""),
    phoneFull: optionalString(row.phone_full),
    age: optionalNumber(row.age),
    drivingYears: optionalNumber(row.driving_years),
    flowState: String(row.flow_state ?? ""),
    leadStage: String(row.lead_stage ?? ""),
    channelType: String(row.channel_type ?? ""),
    intentionArea: String(row.intention_area ?? ""),
    driverType: optionalString(row.driver_type),
    inCompanyTime: String(row.in_company_time),
    fallPublicDays: Number(row.fall_public_days ?? 0),
    possibleJoin: optionalNumber(row.possible_join) as PossibleJoin | undefined,
    latestLinkStatus: Number(row.latest_link_status ?? 4) as LinkStatus,
    latestFollowAt: optionalString(row.latest_follow_at),
    latestFollowUser: optionalString(row.latest_follow_user),
    followCount: Number(row.follow_count ?? 0),
    syncState: String(row.sync_state ?? "synced") as SyncState,
    localStatus: optionalString(row.local_status) as
      | LocalFollowStatus
      | undefined,
    ownerId: optionalString(row.owner_id),
    claimedAt: optionalString(row.claimed_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapFollowUpRow(row: Row): FollowUp {
  return {
    id: String(row.id),
    leadId: String(row.lead_id),
    calledAt: String(row.called_at),
    linkStatus: Number(row.link_status) as FollowUp["linkStatus"],
    possibleJoin: Number(row.possible_join) as PossibleJoin,
    remarkType: optionalString(row.remark_type),
    remark: String(row.remark ?? ""),
    operatorName: String(row.operator_name ?? ""),
    syncState: String(row.sync_state ?? "pending") as SyncState,
    origin: row.origin === "cyf" ? "cyf" : "local",
  };
}

function mapOnboardingRow(row: Row): OnboardingRecord {
  return {
    id: String(row.id),
    driverId: optionalNumber(row.driver_id),
    onboardedAt: String(row.onboarded_at),
    identity:
      row.identity === "didi" || row.identity === "xinju"
        ? row.identity
        : "unknown",
    driverType: String(row.driver_type ?? ""),
  };
}

function mapProfileRow(row: Row): UserProfile {
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ""),
    email: String(row.email ?? ""),
    role: row.role === "admin" ? "admin" : "sales",
    active: row.active !== false,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function assertResult<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Supabase returned no data");
  return data;
}

export function createSupabaseRepository(
  client: SupabaseClient,
): LeadRepository {
  let leads: Lead[] = [];
  let followUps: FollowUp[] = [];
  let onboardingRecords: OnboardingRecord[] = [];
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  const upsertLead = (lead: Lead) => {
    leads = [lead, ...leads.filter((item) => item.id !== lead.id)];
  };

  const load = async () => {
    const [leadResult, followUpResult, onboardingResult] = await Promise.all([
      client
        .from("leads")
        .select("*")
        .order("in_company_time", { ascending: false }),
      client
        .from("follow_ups")
        .select("*")
        .order("called_at", { ascending: false }),
      client
        .from("onboarding_records")
        .select("*")
        .order("onboarded_at", { ascending: false }),
    ]);

    if (leadResult.error) throw new Error(leadResult.error.message);
    if (followUpResult.error) throw new Error(followUpResult.error.message);
    if (onboardingResult.error) throw new Error(onboardingResult.error.message);

    leads = (leadResult.data ?? []).map((row) => mapLeadRow(row as Row));
    followUps = (followUpResult.data ?? []).map((row) =>
      mapFollowUpRow(row as Row),
    );
    onboardingRecords = (onboardingResult.data ?? []).map((row) =>
      mapOnboardingRow(row as Row),
    );
    emit();
  };

  const claimLead = async (id: string) => {
    const result = await client.rpc("claim_lead", { p_lead_id: id });
    const lead = mapLeadRow(assertResult(result.data as Row | null, result.error));
    upsertLead(lead);
    emit();
    return lead;
  };

  return {
    load,
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
    async addFollowUp(input: FollowUpInput) {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("AUTH_REQUIRED");

      const followUpRow = {
        id: createId("follow"),
        lead_id: input.leadId,
        called_at: input.calledAt,
        link_status: input.linkStatus,
        possible_join: input.possibleJoin,
        remark_type: input.remarkType ?? null,
        remark: input.remark,
        operator_name: input.operatorName,
        operator_id: user.id,
        sync_state: "pending",
        origin: "local",
      };
      const followUpResult = await client
        .from("follow_ups")
        .insert(followUpRow)
        .select("*")
        .single();
      const followUp = mapFollowUpRow(
        assertResult(followUpResult.data as Row | null, followUpResult.error),
      );

      const currentLead = leads.find((lead) => lead.id === input.leadId);
      const leadResult = await client
        .from("leads")
        .update({
          latest_link_status: input.linkStatus,
          possible_join: input.possibleJoin,
          latest_follow_at: input.calledAt,
          latest_follow_user: input.operatorName,
          follow_count: (currentLead?.followCount ?? 0) + 1,
          sync_state:
            currentLead?.source === "offline" ? "local_only" : "pending",
        })
        .eq("id", input.leadId)
        .select("*")
        .single();
      const lead = mapLeadRow(
        assertResult(leadResult.data as Row | null, leadResult.error),
      );

      followUps = [followUp, ...followUps];
      upsertLead(lead);
      emit();
      return followUp;
    },
    async addOfflineLead(input: CreateOfflineLeadInput) {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("AUTH_REQUIRED");

      const now = new Date().toISOString();
      const result = await client
        .from("leads")
        .insert({
          id: createId("offline"),
          source: "offline",
          city: input.city,
          company: "宁夏和胜昌信息咨询有限公司（西昌）",
          name: input.name,
          phone_masked: `${input.phone.slice(0, 3)}****${input.phone.slice(-4)}`,
          phone_full: input.phone,
          flow_state: "本地线索",
          lead_stage: "线下新增",
          channel_type: input.channelType,
          intention_area: input.intentionArea,
          in_company_time: now,
          fall_public_days: 0,
          latest_link_status: 4,
          follow_count: 0,
          sync_state: "local_only",
          local_status: input.localStatus,
          owner_id: user.id,
          claimed_at: now,
          created_by: user.id,
        })
        .select("*")
        .single();
      const lead = mapLeadRow(assertResult(result.data as Row | null, result.error));
      upsertLead(lead);
      emit();
      return lead;
    },
    claimLead,
    async assignLead(id, ownerId) {
      const result = await client.rpc("assign_lead", {
        p_lead_id: id,
        p_owner_id: ownerId,
      });
      const lead = mapLeadRow(
        assertResult(result.data as Row | null, result.error),
      );
      upsertLead(lead);
      emit();
      return lead;
    },
    async listProfiles() {
      const result = await client
        .from("profiles")
        .select("id, display_name, email, role, active")
        .order("display_name");
      if (result.error) throw new Error(result.error.message);
      return (result.data ?? []).map((row) => mapProfileRow(row as Row));
    },
    async createAccount(input: CreateAccountInput) {
      const result = await client.functions.invoke("admin-users", {
        body: {
          action: "create",
          ...input,
        },
      });
      if (result.error) throw new Error(result.error.message);
      return mapProfileRow(result.data as Row);
    },
    async updateAccount(input: UpdateAccountInput) {
      const result = await client.functions.invoke("admin-users", {
        body: {
          action: "update",
          ...input,
        },
      });
      if (result.error) throw new Error(result.error.message);
      return mapProfileRow(result.data as Row);
    },
    async sync() {
      await load();
      return {
        processed: 0,
        failed: 0,
        finishedAt: new Date().toISOString(),
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return leads;
    },
  };
}
