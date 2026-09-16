import { ChevronRight } from "lucide-react";
import type { Lead } from "../domain/lead";
import {
  formatDateTime,
  formatLinkStatus,
  formatPossibleJoin,
} from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface LeadListProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}

export function LeadList({ leads, onSelect }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <strong>没有符合条件的线索</strong>
        <span>调整筛选条件后再试。</span>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap lead-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>司机 / 手机号</th>
              <th>城市 / 区域</th>
              <th>线索阶段</th>
              <th>最新外呼</th>
              <th>加盟意向</th>
              <th>最新跟进</th>
              <th>同步</th>
              <th aria-label="操作" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <button
                    className="lead-link"
                    onClick={() => onSelect(lead)}
                    type="button"
                  >
                    <strong>
                      {lead.cyfDriverId
                        ? `ID ${lead.cyfDriverId}`
                        : lead.name || "线下线索"}
                    </strong>
                    <span>{lead.phoneMasked}</span>
                  </button>
                </td>
                <td>
                  <strong>{lead.intentionArea}</strong>
                  <span>{lead.city}</span>
                </td>
                <td>{lead.leadStage}</td>
                <td>
                  <strong>{formatLinkStatus(lead.latestLinkStatus)}</strong>
                  <span>{formatDateTime(lead.latestFollowAt)}</span>
                </td>
                <td>{formatPossibleJoin(lead.possibleJoin)}</td>
                <td>
                  <strong>{lead.latestFollowUser || "尚未跟进"}</strong>
                  <span>{lead.followCount} 次跟进</span>
                </td>
                <td>
                  <StatusBadge state={lead.syncState} />
                </td>
                <td>
                  <button
                    aria-label={`查看 ${lead.phoneMasked} 的线索详情`}
                    className="icon-button"
                    onClick={() => onSelect(lead)}
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lead-card-list">
        {leads.map((lead) => (
          <button
            className="lead-card"
            key={lead.id}
            onClick={() => onSelect(lead)}
            type="button"
          >
            <span className="lead-card__topline">
              <strong>
                {lead.cyfDriverId ? `ID ${lead.cyfDriverId}` : lead.name}
              </strong>
              <StatusBadge state={lead.syncState} />
            </span>
            <span className="lead-card__phone">{lead.phoneMasked}</span>
            <span className="lead-card__meta">
              <span>
                {lead.city} · {lead.intentionArea}
              </span>
              <span>{lead.leadStage}</span>
            </span>
            <span className="lead-card__footer">
              <span>{formatLinkStatus(lead.latestLinkStatus)}</span>
              <span>{formatPossibleJoin(lead.possibleJoin)}</span>
              <span>{formatDateTime(lead.latestFollowAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
