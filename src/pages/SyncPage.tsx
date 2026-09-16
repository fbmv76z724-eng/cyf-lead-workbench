import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import type { Lead } from "../domain/lead";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../utils/format";

interface SyncPageProps {
  leads: Lead[];
  syncing: boolean;
  lastSyncAt?: string;
  onSync: () => Promise<void>;
}

export function SyncPage({
  leads,
  syncing,
  lastSyncAt = "2026-09-16T10:18:00+08:00",
  onSync,
}: SyncPageProps) {
  const issues = leads.filter(
    (lead) => lead.syncState === "conflict" || lead.syncState === "failed",
  );
  const pending = leads.filter((lead) => lead.syncState === "pending");

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">连接器与写回队列</p>
        <h1>同步状态</h1>
        <p>登录、拉取和写回任务的运行情况。</p>
      </header>

      <section className="sync-overview">
        <article className="status-card">
          <CheckCircle2 aria-hidden="true" size={22} />
          <span>连接器</span>
          <strong>在线</strong>
          <small>Chromium 会话有效</small>
        </article>
        <article className="status-card">
          <RefreshCw aria-hidden="true" size={22} />
          <span>待写回</span>
          <strong>{pending.length}</strong>
          <small>不会因页面关闭而丢失</small>
        </article>
        <article className="status-card">
          <AlertTriangle aria-hidden="true" size={22} />
          <span>异常</span>
          <strong>{issues.length}</strong>
          <small>冲突或接口失败</small>
        </article>
        <article className="status-card">
          <Clock3 aria-hidden="true" size={22} />
          <span>最近同步</span>
          <strong>{formatDateTime(lastSyncAt)}</strong>
          <small>自动任务每 2 分钟运行</small>
        </article>
      </section>

      <section className="panel" aria-labelledby="issue-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">需要人工处理</p>
            <h2 id="issue-title">异常线索</h2>
          </div>
          <Button
            disabled={syncing}
            icon={
              <RefreshCw
                aria-hidden="true"
                className={syncing ? "is-spinning" : ""}
                size={17}
              />
            }
            onClick={onSync}
            variant="primary"
          >
            {syncing ? "同步中" : "立即全量同步"}
          </Button>
        </div>

        {issues.length ? (
          <div className="issue-list">
            {issues.map((lead) => (
              <article className="issue-item" key={lead.id}>
                <div>
                  <strong>ID {lead.cyfDriverId}</strong>
                  <span>{lead.phoneMasked}</span>
                </div>
                <StatusBadge state={lead.syncState} />
                <p>
                  {lead.syncState === "conflict"
                    ? "CYF 版本已先更新，等待人工确认。"
                    : "接口写回失败，系统将按退避策略重试。"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-copy">当前没有同步异常。</p>
        )}
      </section>
    </div>
  );
}
