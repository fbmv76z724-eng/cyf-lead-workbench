import { useState } from "react";
import { Download } from "lucide-react";
import type { Lead } from "../domain/lead";
import { getDashboardMetrics } from "../data/selectors";
import { Button } from "../components/Button";
import { KpiCard } from "../components/KpiCard";
import { Activity, FileSpreadsheet, PhoneCall, Target } from "lucide-react";

interface ReportsPageProps {
  leads: Lead[];
}

export function ReportsPage({ leads }: ReportsPageProps) {
  const [period, setPeriod] = useState("today");
  const [feedback, setFeedback] = useState("");
  const metrics = getDashboardMetrics(leads);

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">经营分析</p>
          <h1>统计与导出</h1>
          <p>当前为 Web 演示数据，导出任务会沿用筛选条件。</p>
        </div>
        <div className="header-actions">
          <label className="field">
            <span className="sr-only">统计周期</span>
            <select
              aria-label="统计周期"
              onChange={(event) => setPeriod(event.target.value)}
              value={period}
            >
              <option value="today">今日</option>
              <option value="week">近 7 天</option>
              <option value="month">近 30 天</option>
            </select>
          </label>
          <Button
            icon={<Download aria-hidden="true" size={17} />}
            onClick={() =>
              setFeedback(`已创建 ${period === "today" ? "今日" : "所选周期"} Excel 导出任务。`)
            }
            variant="primary"
          >
            导出 Excel
          </Button>
        </div>
      </header>

      {feedback ? (
        <div className="inline-notice" role="status">
          {feedback}
        </div>
      ) : null}

      <section aria-label="统计指标" className="kpi-grid kpi-grid--four">
        <KpiCard
          context="按流入司服时间"
          icon={Activity}
          label="今日流入"
          value={metrics.todayInflow}
        />
        <KpiCard
          context="等待第一次外呼"
          icon={PhoneCall}
          label="待外呼"
          tone="amber"
          value={metrics.waitingForCall}
        />
        <KpiCard
          context="外呼状态为已接通"
          icon={Target}
          label="接通线索"
          tone="green"
          value={leads.filter((lead) => lead.latestLinkStatus === 1).length}
        />
        <KpiCard
          context="线下本地状态"
          icon={FileSpreadsheet}
          label="线下待跟进"
          value={metrics.offlineWaiting}
        />
      </section>

      <section className="panel" aria-labelledby="report-breakdown-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">漏斗明细</p>
            <h2 id="report-breakdown-title">外呼结果分布</h2>
          </div>
        </div>
        <div className="report-bars">
          {metrics.funnel.map((item) => {
            const total = metrics.funnel.reduce(
              (sum, point) => sum + point.count,
              0,
            );
            return (
              <div className="report-bar" key={item.label}>
                <span>{item.label}</span>
                <div aria-hidden="true">
                  <i
                    style={{
                      width: `${(item.count / Math.max(total, 1)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{item.count}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
