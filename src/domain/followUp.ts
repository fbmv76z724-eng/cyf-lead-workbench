import type { PossibleJoin, SyncState } from "./lead";

export interface FollowUp {
  id: string;
  leadId: string;
  calledAt: string;
  linkStatus: 0 | 1 | 2 | 3;
  possibleJoin: PossibleJoin;
  remarkType?: string;
  remark: string;
  operatorName: string;
  syncState: SyncState;
  origin: "local" | "cyf";
}

export interface FollowUpInput {
  leadId: string;
  calledAt: string;
  linkStatus: 0 | 1 | 2 | 3;
  possibleJoin: PossibleJoin;
  remarkType?: string;
  remark: string;
  operatorName: string;
}
