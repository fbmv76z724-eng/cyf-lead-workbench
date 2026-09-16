import { useState } from "react";
import { Download } from "lucide-react";
import type { UserProfile } from "../auth/permissions";
import { emptyLeadFilters, filterLeads, type LeadFilters as LeadFilterValue } from "../data/selectors";
import type { FollowUp, FollowUpInput } from "../domain/followUp";
import type { Lead } from "../domain/lead";
import { Button } from "../components/Button";
import { LeadDetailDrawer } from "../components/LeadDetailDrawer";
import { LeadFilters } from "../components/LeadFilters";
import { LeadList } from "../components/LeadList";

interface LeadsPageProps {
  leads: Lead[];
  getFollowUps: (leadId: string) => FollowUp[];
  onSelect: (lead: Lead) => void;
  currentUserId?: string;
  onClaim?: (lead: Lead) => Promise<unknown>;
  owners?: UserProfile[];
  onAssign?: (leadId: string, ownerId: string | null) => Promise<void>;
  selectedLead?: Lead;
  onCloseDetail: () => void;
  onSubmitFollowUp: (input: FollowUpInput) => Promise<void>;
  onRevealPhone: (lead: Lead) => Promise<string | undefined>;
  initialFilters?: LeadFilterValue;
}

export function LeadsPage({
  leads,
  getFollowUps,
  onSelect,
  currentUserId,
  onClaim,
  owners,
  onAssign,
  selectedLead,
  onCloseDetail,
  onSubmitFollowUp,
  onRevealPhone,
  initialFilters,
}: LeadsPageProps) {
  const [filters, setFilters] = useState<LeadFilterValue>(
    initialFilters ?? emptyLeadFilters,
  );
  const [scope, setScope] = useState<"all" | "mine" | "unassigned">("all");
  const [exportFeedback, setExportFeedback] = useState("");
  const filteredLeads = filterLeads(leads, filters).filter((lead) => {
    if (scope === "mine") return lead.ownerId === currentUserId;
    if (scope === "unassigned") return !lead.ownerId;
    return true;
  });
  const cities = [...new Set(leads.map((lead) => lead.city))];

  const exportLeads = () => {
    setExportFeedback(`已按当前条件创建导出任务，共 ${filteredLeads.length} 条。`);
  };

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">全部线索</p>
          <h1>线索管理</h1>
          <p>集中查看 CYF 同步线索和仅本地线下线索。</p>
        </div>
        <Button
          icon={<Download aria-hidden="true" size={17} />}
          onClick={exportLeads}
          variant="primary"
        >
          导出当前结果
        </Button>
      </header>

      <LeadFilters cities={cities} onChange={setFilters} value={filters} />

      {currentUserId ? (
        <div aria-label="线索归属范围" className="scope-bar" role="group">
          <button
            aria-pressed={scope === "all"}
            onClick={() => setScope("all")}
            type="button"
          >
            全部可视线索
          </button>
          <button
            aria-pressed={scope === "mine"}
            onClick={() => setScope("mine")}
            type="button"
          >
            我的线索
          </button>
          <button
            aria-pressed={scope === "unassigned"}
            onClick={() => setScope("unassigned")}
            type="button"
          >
            待认领
          </button>
        </div>
      ) : null}

      <section className="panel list-panel" aria-labelledby="lead-list-title">
        <div className="panel-heading">
          <div>
            <h2 id="lead-list-title">线索列表</h2>
            <p>当前结果 {filteredLeads.length} 条</p>
          </div>
          {exportFeedback ? (
            <span className="inline-feedback" role="status">
              {exportFeedback}
            </span>
          ) : null}
        </div>
        <LeadList
          leads={filteredLeads}
          onClaim={onClaim}
          onRevealPhone={onRevealPhone}
          onSelect={onSelect}
        />
      </section>

      <LeadDetailDrawer
        history={selectedLead ? getFollowUps(selectedLead.id) : []}
        lead={selectedLead}
        onAssign={onAssign}
        onClose={onCloseDetail}
        onRevealPhone={onRevealPhone}
        onSubmitFollowUp={onSubmitFollowUp}
        open={Boolean(selectedLead)}
        owners={owners}
      />
    </div>
  );
}
