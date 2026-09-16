import { useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "./app/AppShell";
import {
  createMockRepository,
  type CreateOfflineLeadInput,
} from "./data/repository";
import { mockFollowUps, mockLeads } from "./data/mockLeads";
import { mockOnboardingRecords } from "./data/mockOnboarding";
import type { FollowUpInput } from "./domain/followUp";
import type { Lead } from "./domain/lead";
import type { PageId } from "./domain/navigation";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { OfflineLeadsPage } from "./pages/OfflineLeadsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SyncPage } from "./pages/SyncPage";

export default function App() {
  const repository = useMemo(
    () => createMockRepository(mockLeads, mockFollowUps),
    [],
  );
  const leads = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string>();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState("2026-09-16T10:18:00+08:00");
  const [lastSyncLabel, setLastSyncLabel] = useState("2 分钟前");

  const selectedLead = selectedLeadId
    ? leads.find((lead) => lead.id === selectedLeadId)
    : undefined;

  const openLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await repository.sync();
      setLastSyncAt(result.finishedAt);
      setLastSyncLabel("刚刚");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateOffline = (input: CreateOfflineLeadInput) =>
    repository.addOfflineLead(input);

  const handleFollowUp = async (input: FollowUpInput) => {
    await repository.addFollowUp(input);
  };

  return (
    <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === "dashboard" ? (
        <DashboardPage
          leads={leads}
          lastSyncLabel={lastSyncLabel}
          onNavigate={setCurrentPage}
          onboardingRecords={mockOnboardingRecords}
          onSync={handleSync}
          syncing={syncing}
        />
      ) : null}

      {currentPage === "leads" ? (
        <LeadsPage
          getFollowUps={repository.getFollowUps}
          leads={leads}
          onCloseDetail={() => setSelectedLeadId(undefined)}
          onRevealPhone={async (lead) => lead.phoneFull}
          onSelect={openLead}
          onSubmitFollowUp={handleFollowUp}
          selectedLead={selectedLead}
        />
      ) : null}

      {currentPage === "offline" ? (
        <OfflineLeadsPage
          leads={leads}
          onCreate={handleCreateOffline}
          onFollowUp={(lead) => {
            setSelectedLeadId(lead.id);
            setCurrentPage("leads");
          }}
        />
      ) : null}

      {currentPage === "reports" ? <ReportsPage leads={leads} /> : null}

      {currentPage === "sync" ? (
        <SyncPage
          lastSyncAt={lastSyncAt}
          leads={leads}
          onSync={handleSync}
          syncing={syncing}
        />
      ) : null}
    </AppShell>
  );
}
