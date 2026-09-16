import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseRepository,
  mapLeadRow,
} from "../src/data/supabaseRepository";

const leadRow = {
  id: "lead-001",
  source: "cyf",
  cyf_lead_id: 8380293,
  cyf_driver_id: 2000000000000000,
  city: "凉山彝族自治州",
  company: "宁夏和胜昌信息咨询有限公司（西昌）",
  name: "",
  phone_masked: "191****5089",
  phone_full: "19100000001",
  age: null,
  driving_years: null,
  flow_state: "进行中",
  lead_stage: "首次流入",
  channel_type: "线上",
  intention_area: "会东县",
  driver_type: null,
  in_company_time: "2026-09-16T04:14:23.000Z",
  fall_public_days: 6,
  possible_join: 2,
  latest_link_status: 1,
  latest_follow_at: "2026-09-16T06:32:33.000Z",
  latest_follow_user: "测试跟进员",
  follow_count: 1,
  sync_state: "synced",
  local_status: null,
  owner_id: "sales-user",
  claimed_at: "2026-09-16T07:00:00.000Z",
  created_by: null,
  created_at: "2026-09-16T04:14:23.000Z",
  updated_at: "2026-09-16T07:00:00.000Z",
};

it("maps a Supabase lead row to the frontend model", () => {
  expect(mapLeadRow(leadRow)).toMatchObject({
    id: "lead-001",
    cyfDriverId: 2000000000000000,
    phoneFull: "19100000001",
    latestLinkStatus: 1,
    possibleJoin: 2,
    ownerId: "sales-user",
    claimedAt: "2026-09-16T07:00:00.000Z",
  });
});

it("claims a lead through the atomic database function", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: leadRow, error: null });
  const client = { rpc } as unknown as SupabaseClient;
  const repository = createSupabaseRepository(client);

  await expect(repository.claimLead("lead-001")).resolves.toMatchObject({
    id: "lead-001",
    ownerId: "sales-user",
  });
  expect(rpc).toHaveBeenCalledWith("claim_lead", {
    p_lead_id: "lead-001",
  });
});

it("assigns a lead through the administrator database function", async () => {
  const rpc = vi.fn().mockResolvedValue({
    data: { ...leadRow, owner_id: null, claimed_at: null },
    error: null,
  });
  const client = { rpc } as unknown as SupabaseClient;
  const repository = createSupabaseRepository(client);

  await expect(repository.assignLead("lead-001", null)).resolves.toMatchObject({
    id: "lead-001",
    ownerId: undefined,
    claimedAt: undefined,
  });
  expect(rpc).toHaveBeenCalledWith("assign_lead", {
    p_lead_id: "lead-001",
    p_owner_id: null,
  });
});
