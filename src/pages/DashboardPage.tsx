import {
  AlertTriangle,
  BadgeCheck,
  BookUser,
  PhoneCall,
  PhoneOutgoing,
  Waves,
} from "lucide-react";
import type { Lead } from "../domain/lead";
import type { PageId } from "../domain/navigation";
import { getDashboardMetrics } from "../data/selectors";
import { formatDateTime, formatLinkStatus } from "../utils/format";
import { KpiCard } from "../components/KpiCard";
import { StatusBadge } from "../components/StatusBadge";
import { SyncHealthPanel } from "../components/SyncHealthPanel";

interface DashboardPageProps {
  leads: Lead[];
  lastSyncLabel?: string;
  onNavigate: (page: PageId) => void;
  syncing?: boolean;
  onSync: () => void;
}

export function DashboardPage({
  leads,
  lastSyncLabel,
  onNavigate,
  syncing = false,
  onSync,
}: DashboardPageProps) {
  const metrics = getDashboardMetrics(leads);
  const maxFunnel = Math.max(...metrics.funnel.map((point) => point.count), 1);
  const recentQueue = [...leads]
    .filter(
      (lead) =>
        lead.source === "cyf" &&
        (lead.latestLinkStatus === 4 ||
          lead.syncState === "conflict" ||
          lead.syncState === "failed"),
    )
    .sort(
      (a, b) =>
        new Date(a.inCompanyTime).getTime() -
        new Date(b.inCompanyTime).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">2026-09-16 · 实时业务概览</p>
          <h1>今日工作台</h1>
          <p>优先处理今日新流入、待外呼和同步异常线索。</p>
        </div>
      </header>

      <section aria-label="今日关键指标" className="kpi-grid">
        <KpiCard
          context="今日流入司服"
          icon={Waves}
          label="今日流入"
          onClick={() => onNavigate("leads")}
          value={metrics.todayInflow}
        />
        <KpiCard
          context="等待第一次外呼"
          icon={PhoneCall}
          label="待外呼"
          onClick={() => onNavigate("leads")}
          tone="amber"
          value={metrics.waitingForCall}
        />
        <KpiCard
          context="按最新跟进时间"
          icon={PhoneOutgoing}
          label="今日已呼"
          onClick={() => onNavigate("leads")}
          tone="slate"
          value={metrics.calledToday}
        />
        <KpiCard
          context="今日外呼已接通"
          icon={BadgeCheck}
          label="今日接通"
          onClick={() => onNavigate("leads")}
          tone="green"
          value={metrics.connectedToday}
        />
        <KpiCard
          context="仅本地线索"
          icon={BookUser}
          label="线下待跟进"
          onClick={() => onNavigate("offline")}
          tone="blue"
          value={metrics.offlineWaiting}
        />
        <KpiCard
          context="冲突或写回失败"
          icon={AlertTriangle}
          label="同步异常"
          onClick={() => onNavigate("sync")}
          tone="red"
          value={metrics.syncIssues}
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel funnel-panel" aria-labelledby="funnel-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">当前私海线索</p>
              <h2 id="funnel-title">外呼漏斗</h2>
            </div>
            <span>共 {leads.filter((lead) => lead.source === "cyf").length} 条</span>
          </div>

          <div className="funnel-chart">
            {metrics.funnel.map((point, index) => (
              <div className="funnel-row" key={point.label}>
                <span className="funnel-label">{point.label}</span>
                <div className="funnel-track" aria-hidden="true">
                  <span
                    className={`funnel-bar funnel-bar--${index}`}
                    style={{ width: `${Math.max((point.count / maxFunnel) * 100, 4)}%` }}
                  />
                </div>
                <strong>{point.count}</strong>
              </div>
            ))}
          </div>
          <p className="chart-summary">
            未外呼 {metrics.funnel[0].count} 条，占当前线索{" "}
            {Math.round(
              (metrics.funnel[0].count /
                Math.max(
                  leads.filter((lead) => lead.source === "cyf").length,
                  1,
                )) *
                100,
            )}
            %。
          </p>
        </section>

        <section className="panel trend-panel" aria-labelledby="trend-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">最近 7 天</p>
              <h2 id="trend-title">流入与外呼趋势</h2>
            </div>
          </div>
          <TrendChart points={metrics.trend} />
          <details className="data-details">
            <summary>查看趋势数据表</summary>
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>流入</th>
                  <th>外呼</th>
                </tr>
              </thead>
              <tbody>
                {metrics.trend.map((point) => (
                  <tr key={point.label}>
                    <td>{point.label}</td>
                    <td>{point.inflow}</td>
                    <td>{point.calls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <SyncHealthPanel
          issueCount={metrics.syncIssues}
          lastSyncLabel={lastSyncLabel}
          onSync={onSync}
          syncing={syncing}
        />

        <section className="panel queue-panel" aria-labelledby="queue-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">按流入时间排序</p>
              <h2 id="queue-title">优先处理</h2>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("leads")}
              type="button"
            >
              查看全部
            </button>
          </div>

          <div className="queue-list">
            {recentQueue.map((lead) => (
              <button
                className="queue-item"
                key={lead.id}
                onClick={() => onNavigate("leads")}
                type="button"
              >
                <span className="queue-item__identity">
                  <strong>{lead.cyfDriverId}</strong>
                  <span>{lead.phoneMasked}</span>
                </span>
                <span>
                  <strong>{formatLinkStatus(lead.latestLinkStatus)}</strong>
                  <small>{formatDateTime(lead.inCompanyTime)}</small>
                </span>
                <StatusBadge state={lead.syncState} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface TrendChartProps {
  points: Array<{ label: string; inflow: number; calls: number }>;
}

function TrendChart({ points }: TrendChartProps) {
  const width = 560;
  const height = 190;
  const padding = 24;
  const max = Math.max(...points.flatMap((point) => [point.inflow, point.calls]), 1);
  const x = (index: number) =>
    padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
  const y = (value: number) =>
    height - padding - (value / max) * (height - padding * 2);
  const line = (key: "inflow" | "calls") =>
    points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");

  return (
    <div className="trend-chart">
      <div className="chart-legend">
        <span>
          <i className="legend-line legend-line--inflow" /> 流入
        </span>
        <span>
          <i className="legend-line legend-line--calls" /> 外呼
        </span>
      </div>
      <svg
        aria-label="最近七天流入与外呼趋势图"
        className="trend-svg"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            className="chart-grid-line"
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + ratio * (height - padding * 2)}
            y2={padding + ratio * (height - padding * 2)}
          />
        ))}
        <polyline className="chart-line chart-line--inflow" points={line("inflow")} />
        <polyline className="chart-line chart-line--calls" points={line("calls")} />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle
              className="chart-point chart-point--inflow"
              cx={x(index)}
              cy={y(point.inflow)}
              r="3.5"
            />
            <circle
              className="chart-point chart-point--calls"
              cx={x(index)}
              cy={y(point.calls)}
              r="3.5"
            />
            <text className="chart-label" textAnchor="middle" x={x(index)} y={height - 5}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
