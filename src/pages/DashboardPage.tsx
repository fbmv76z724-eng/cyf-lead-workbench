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
import type { OnboardingRecord } from "../domain/onboarding";
import {
  getDashboardMetrics,
  getPeriodComparisonMetrics,
} from "../data/selectors";
import { formatDateTime, formatLinkStatus } from "../utils/format";
import { KpiCard } from "../components/KpiCard";
import { StatusBadge } from "../components/StatusBadge";
import { SyncHealthPanel } from "../components/SyncHealthPanel";

interface DashboardPageProps {
  leads: Lead[];
  onboardingRecords?: OnboardingRecord[];
  lastSyncLabel?: string;
  onNavigate: (page: PageId) => void;
  syncing?: boolean;
  onSync: () => void;
}

export function DashboardPage({
  leads,
  onboardingRecords = [],
  lastSyncLabel,
  onNavigate,
  syncing = false,
  onSync,
}: DashboardPageProps) {
  const metrics = getDashboardMetrics(leads);
  const periods = getPeriodComparisonMetrics(leads, onboardingRecords);
  const periodRows = [
    { key: "today", label: "今日", metrics: periods.today },
    { key: "thisWeek", label: "本周", metrics: periods.thisWeek },
    { key: "lastWeek", label: "上周", metrics: periods.lastWeek },
    { key: "thisMonth", label: "本月", metrics: periods.thisMonth },
  ];
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

      <section className="panel period-panel" aria-labelledby="period-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CYF 线索口径</p>
            <h2 id="period-title">经营周期对比</h2>
          </div>
          <p>上岗数据按同期计算</p>
        </div>

        <div
          aria-label="今日、本周、上周和本月线索转化数据"
          className="period-table"
          role="table"
        >
          <div className="period-table__head" role="row">
            <span role="columnheader">周期</span>
            <span role="columnheader">流入线索</span>
            <span role="columnheader">上岗司机</span>
            <span role="columnheader">转化率</span>
            <span role="columnheader">外呼</span>
          </div>
          {periodRows.map((row, index) => (
            <div
              className="period-table__row"
              data-current={index === 0 ? "true" : undefined}
              key={row.key}
              role="row"
            >
              <strong className="period-table__period" role="cell">
                {row.label}
              </strong>
              <span role="cell">{row.metrics.inflow}</span>
              <span role="cell">{row.metrics.onboarded}</span>
              <span className="period-table__rate" role="cell">
                {row.metrics.conversionRate}%
              </span>
              <span role="cell">{row.metrics.calls}</span>
            </div>
          ))}
        </div>
        <p className="period-method">
          线索转化率 = 同期上岗司机数 ÷ 同期流入线索数
        </p>
      </section>

      <section className="panel period-panel" aria-labelledby="onboarding-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CYF 已上岗口径</p>
            <h2 id="onboarding-title">司机上岗结构</h2>
          </div>
          <p>按上岗时间统计</p>
        </div>

        <div
          aria-label="今日、本周、上周和本月司机上岗结构"
          className="period-table"
          role="table"
        >
          <div className="period-table__head" role="row">
            <span role="columnheader">周期</span>
            <span role="columnheader">上岗司机</span>
            <span role="columnheader">滴滴司机</span>
            <span role="columnheader">新桔司机</span>
            <span role="columnheader">纯新司机</span>
          </div>
          {periodRows.map((row, index) => (
            <div
              className="period-table__row"
              data-current={index === 0 ? "true" : undefined}
              key={row.key}
              role="row"
            >
              <strong className="period-table__period" role="cell">
                {row.label}
              </strong>
              <span className="period-table__rate" role="cell">
                {row.metrics.onboarding.total}
              </span>
              <span role="cell">{row.metrics.onboarding.didi}</span>
              <span role="cell">{row.metrics.onboarding.xinju}</span>
              <span role="cell">{row.metrics.onboarding.newDrivers}</span>
            </div>
          ))}
        </div>
        <p className="period-method">
          上岗总数按 CYF 招募流程“已上岗”去重；滴滴、新桔按司机身份统计，纯新按司机类型统计。
        </p>
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

function getTrendScale(points: TrendChartProps["points"]) {
  const dataMax = Math.max(
    ...points.flatMap((point) => [point.inflow, point.calls]),
    1,
  );
  const roughStep = dataMax / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, niceNormalized * magnitude);
  const max = Math.ceil(dataMax / step) * step;

  return {
    max,
    ticks: Array.from(
      { length: Math.round(max / step) + 1 },
      (_, index) => index * step,
    ),
  };
}

function TrendChart({ points }: TrendChartProps) {
  const { max, ticks } = getTrendScale(points);
  const plotTop = 8;
  const plotHeight = 88;
  const plotInset = 8;
  const x = (index: number) =>
    plotInset +
    (index / Math.max(points.length - 1, 1)) * (100 - plotInset * 2);
  const y = (value: number) => plotTop + plotHeight - (value / max) * plotHeight;
  const line = (key: "inflow" | "calls") =>
    points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");

  return (
    <div className="trend-chart">
      <div className="chart-legend">
        <span className="chart-legend__item">
          <i aria-hidden="true" className="legend-line legend-line--inflow" />
          流入
        </span>
        <span className="chart-legend__item">
          <i aria-hidden="true" className="legend-line legend-line--calls" />
          外呼
        </span>
      </div>
      <div className="trend-plot">
        <div aria-hidden="true" className="trend-y-axis">
          {ticks.map((tick) => (
            <span key={tick} style={{ top: `${y(tick)}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <div
          aria-label="最近七天流入与外呼趋势图"
          className="trend-canvas"
          role="img"
        >
          <svg
            aria-hidden="true"
            className="trend-svg"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {ticks.map((tick) => (
              <line
                className="chart-grid-line"
                key={tick}
                x1={plotInset}
                x2={100 - plotInset}
                y1={y(tick)}
                y2={y(tick)}
              />
            ))}
            <polyline
              className="chart-line chart-line--inflow"
              points={line("inflow")}
            />
            <polyline
              className="chart-line chart-line--calls"
              points={line("calls")}
            />
          </svg>
          {points.map((point, index) => (
            <span
              aria-hidden="true"
              className="chart-point chart-point--inflow"
              key={`${point.label}-inflow`}
              style={{ left: `${x(index)}%`, top: `${y(point.inflow)}%` }}
            />
          ))}
          {points.map((point, index) => (
            <span
              aria-hidden="true"
              className="chart-point chart-point--calls"
              key={`${point.label}-calls`}
              style={{ left: `${x(index)}%`, top: `${y(point.calls)}%` }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="trend-x-axis">
          {points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
