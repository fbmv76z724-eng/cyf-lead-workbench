import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "./app/AppShell";
import { useAuth } from "./auth/AuthProvider";
import type { UserProfile } from "./auth/permissions";
import {
  type CreateAccountInput,
  createMockRepository,
  type CreateOfflineLeadInput,
} from "./data/repository";
import { createSupabaseRepository } from "./data/supabaseRepository";
import { getSupabaseClient } from "./data/supabaseClient";
import type { FollowUpInput } from "./domain/followUp";
import type { Lead } from "./domain/lead";
import type { PageId } from "./domain/navigation";
import type { OnboardingRecord } from "./domain/onboarding";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { OfflineLeadsPage } from "./pages/OfflineLeadsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SyncPage } from "./pages/SyncPage";
import { LoginPage } from "./pages/LoginPage";
import { AccountsPage } from "./pages/AccountsPage";

interface WorkbenchAppProps {
  profile?: UserProfile;
  onSignOut?: () => Promise<void>;
}

const devAdminProfile: UserProfile = {
  id: "dev-admin",
  displayName: "开发管理员",
  role: "admin",
  active: true,
};

export function WorkbenchApp({
  profile = devAdminProfile,
  onSignOut,
}: WorkbenchAppProps) {
  const client = getSupabaseClient();
  const repository = useMemo(
    () =>
      client
        ? createSupabaseRepository(client)
        : createMockRepository([], []),
    [client],
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
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [onboardingRecords, setOnboardingRecords] = useState<
    OnboardingRecord[]
  >([]);
  const isAdmin = profile.role === "admin";

  useEffect(() => {
    if (!client) {
      void repository.load();
      return;
    }
    let active = true;
    void repository.load().then(() => {
      if (active) setOnboardingRecords(repository.getOnboardingRecords());
    });
    return () => {
      active = false;
    };
  }, [client, repository]);

  useEffect(() => {
    if (!isAdmin || !client) return;
    let active = true;
    setProfilesLoading(true);
    setProfilesError("");
    void repository
      .listProfiles()
      .then((nextProfiles) => {
        if (active) setProfiles(nextProfiles);
      })
      .catch(() => {
        if (active) setProfilesError("账号列表加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setProfilesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, isAdmin, repository]);

  useEffect(() => {
    if (isAdmin) return;
    if (
      currentPage === "reports" ||
      currentPage === "sync" ||
      currentPage === "accounts"
    ) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAdmin]);

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

  const handleCreateOffline = async (input: CreateOfflineLeadInput) =>
    repository.addOfflineLead(input);

  const handleFollowUp = async (input: FollowUpInput) => {
    await repository.addFollowUp(input);
  };

  const handleClaim = async (lead: Lead) => {
    await repository.claimLead(lead.id);
    setSelectedLeadId(lead.id);
  };

  const handleAssign = async (leadId: string, ownerId: string | null) => {
    await repository.assignLead(leadId, ownerId);
  };

  const handleUpdateProfile = async (
    target: UserProfile,
    changes: Pick<UserProfile, "role" | "active">,
  ) => {
    setProfilesError("");
    try {
      const updated = await repository.updateProfile(target.id, changes);
      setProfiles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      setProfilesError("账号更新失败，请稍后重试。");
    }
  };

  const handleCreateAccount = async (input: CreateAccountInput) => {
    const created = await repository.createAccount(input);
    setProfiles((current) => [created, ...current]);
  };

  return (
    <AppShell
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onSignOut={onSignOut}
      profile={profile}
    >
      {currentPage === "dashboard" ? (
        <DashboardPage
          leads={leads}
          lastSyncLabel={lastSyncLabel}
          onNavigate={setCurrentPage}
          onboardingRecords={onboardingRecords}
          onSync={handleSync}
          showAdminTools={isAdmin}
          syncing={syncing}
        />
      ) : null}

      {currentPage === "leads" ? (
        <LeadsPage
          currentUserId={profile.id}
          getFollowUps={repository.getFollowUps}
          leads={leads}
          onAssign={isAdmin ? handleAssign : undefined}
          onClaim={isAdmin ? undefined : handleClaim}
          onCloseDetail={() => setSelectedLeadId(undefined)}
          onRevealPhone={async (lead) => lead.phoneFull}
          onSelect={openLead}
          onSubmitFollowUp={handleFollowUp}
          selectedLead={selectedLead}
          owners={isAdmin ? profiles : undefined}
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

      {isAdmin && currentPage === "reports" ? (
        <ReportsPage leads={leads} />
      ) : null}

      {isAdmin && currentPage === "sync" ? (
        <SyncPage
          lastSyncAt={lastSyncAt}
          leads={leads}
          onSync={handleSync}
          syncing={syncing}
        />
      ) : null}

      {isAdmin && currentPage === "accounts" ? (
        <AccountsPage
          error={profilesError}
          loading={profilesLoading}
          onCreate={handleCreateAccount}
          onUpdate={handleUpdateProfile}
          profiles={profiles}
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
    signOut,
  } = useAuth();

  if (configurationMissing) {
    return import.meta.env.DEV ? <WorkbenchApp /> : <SetupPage />;
  }
  if (loading) return <LoadingPage />;
  if (!session || !profile) return <LoginPage error={error} signIn={signIn} />;

  return <WorkbenchApp onSignOut={signOut} profile={profile} />;
}
