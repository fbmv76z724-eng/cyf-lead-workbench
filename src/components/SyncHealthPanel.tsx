import { CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface SyncHealthPanelProps {
  syncing?: boolean;
  issueCount: number;
  lastSyncLabel?: string;
  onSync: () => void;
}

export function SyncHealthPanel({
  syncing = false,
  issueCount,
  lastSyncLabel = "2 分钟前",
  onSync,
}: SyncHealthPanelProps) {
  const healthy = issueCount === 0;

  return (
    <section className="panel sync-health" aria-labelledby="sync-health-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">数据连接</p>
          <h2 id="sync-health-title">同步状态</h2>
        </div>
        <span className={healthy ? "health-label is-healthy" : "health-label"}>
          {healthy ? "同步正常" : `${issueCount} 条待处理`}
        </span>
      </div>

      <div className="sync-health__facts">
        <span>
          <CheckCircle2 aria-hidden="true" size={17} />
          最近拉取 {lastSyncLabel}
        </span>
        <span>
          <Clock3 aria-hidden="true" size={17} />
          下次约 1 分钟后
        </span>
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
        {syncing ? "同步中" : "立即同步"}
      </Button>
    </section>
  );
}
