import type { FollowUp } from "../domain/followUp";
import type { Lead } from "../domain/lead";
import { cyfSnapshot } from "./cyfSnapshot";
import { cyfFollowUps } from "./cyfFollowUps";

export const mockLeads: Lead[] = [...cyfSnapshot].sort(
  (a, b) =>
    new Date(b.inCompanyTime).getTime() - new Date(a.inCompanyTime).getTime(),
);

export const mockFollowUps: FollowUp[] = cyfFollowUps;
