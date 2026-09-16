import { useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "./app/AppShell";
import { useAuth } from "./auth/AuthProvider";
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
import { LoginPage } from "./pages/LoginPage";

export function WorkbenchApp() {
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

function SetupPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="setup-title">
        <div className="auth-mark">
          <span aria-hidden="true">配</span>
        </div>
        <div>
          <p className="eyebrow">CYF Workbench</p>
          <h1 id="setup-title">工作台尚未配置</h1>
          <p>请先配置 Supabase 公开连接信息，再重新构建并发布网页。</p>
        </div>
        <dl className="setup-list">
          <div>
            <dt>VITE_SUPABASE_URL</dt>
            <dd>Supabase 项目 URL</dd>
          </div>
          <div>
            <dt>VITE_SUPABASE_ANON_KEY</dt>
            <dd>Supabase 匿名公开密钥</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

function LoadingPage() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-card--loading" aria-live="polite">
        <span className="auth-spinner" aria-hidden="true" />
        <h1>正在加载工作台</h1>
        <p>正在验证登录状态，请稍候。</p>
      </section>
    </main>
  );
}

export default function App() {
  const {
    configurationMissing,
    loading,
    profile,
    session,
    error,
    signIn,
  } = useAuth();

  if (configurationMissing) return <SetupPage />;
  if (loading) return <LoadingPage />;
  if (!session || !profile) return <LoginPage error={error} signIn={signIn} />;

  return <WorkbenchApp />;
}
