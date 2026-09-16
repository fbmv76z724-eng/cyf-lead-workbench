import { useState } from "react";
import { ChevronRight, Copy, Eye, LoaderCircle } from "lucide-react";
import type { Lead } from "../domain/lead";
import { copyText } from "../utils/clipboard";
import {
  formatDateTime,
  formatLeadOrigin,
  formatLinkStatus,
  formatPossibleJoin,
} from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface LeadListProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onRevealPhone?: (lead: Lead) => Promise<string | undefined>;
}

export function LeadList({
  leads,
  onSelect,
  onRevealPhone,
}: LeadListProps) {
  const [revealedPhones, setRevealedPhones] = useState<Record<string, string>>(
    {},
  );
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [busyPhoneIds, setBusyPhoneIds] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState("");

  const copyValue = async (value: string, successMessage: string) => {
    setFeedback("");
    try {
      await copyText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback("复制失败，请手动获取后复制。");
    }
  };

  const revealPhone = async (lead: Lead) => {
    if (!onRevealPhone || busyPhoneIds[lead.id]) return;

    setPhoneErrors((current) => ({ ...current, [lead.id]: "" }));
    setBusyPhoneIds((current) => ({ ...current, [lead.id]: true }));

    try {
      const phone = await onRevealPhone(lead);
      if (!phone) {
        setPhoneErrors((current) => ({
          ...current,
          [lead.id]: "暂未获取到完整手机号，请重试。",
        }));
        return;
      }

      setRevealedPhones((current) => ({ ...current, [lead.id]: phone }));
      setPhoneErrors((current) => ({ ...current, [lead.id]: "" }));
    } catch {
      setPhoneErrors((current) => ({
        ...current,
        [lead.id]: "获取手机号失败，请重试。",
      }));
    } finally {
      setBusyPhoneIds((current) => ({ ...current, [lead.id]: false }));
    }
  };

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
      {feedback ? (
        <div className="list-feedback" role="status">
          {feedback}
        </div>
      ) : null}

      <div className="table-wrap lead-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>司机 / 手机号</th>
              <th>流入时间</th>
              <th>司机来源</th>
              <th>城市 / 区域</th>
              <th>线索阶段</th>
              <th>跟进人员</th>
              <th>加盟意向</th>
              <th>同步</th>
              <th aria-label="操作" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const displayedPhone =
                revealedPhones[lead.id] || lead.phoneMasked;
              const phoneError = phoneErrors[lead.id];
              const revealingPhone = Boolean(busyPhoneIds[lead.id]);

              return (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-identity">
                      <div className="lead-identity__line">
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
                        </button>
                        {lead.cyfDriverId ? (
                          <button
                            aria-label={`复制司机ID ${lead.cyfDriverId}`}
                            className="inline-icon-button"
                            onClick={() =>
                              copyValue(
                                String(lead.cyfDriverId),
                                "司机 ID 已复制。",
                              )
                            }
                            title="复制司机 ID"
                            type="button"
                          >
                            <Copy aria-hidden="true" size={14} />
                          </button>
                        ) : null}
                      </div>
                      <div className="lead-identity__line">
                        <span
                          className={
                            revealedPhones[lead.id]
                              ? "lead-phone lead-phone--revealed"
                              : "lead-phone"
                          }
                        >
                          {displayedPhone}
                        </span>
                        {onRevealPhone ? (
                          revealedPhones[lead.id] ? (
                            <button
                              aria-label={`复制完整手机号 ${displayedPhone}`}
                              className="inline-icon-button"
                              onClick={() =>
                                copyValue(displayedPhone, "手机号已复制。")
                              }
                              title="复制完整手机号"
                              type="button"
                            >
                              <Copy aria-hidden="true" size={14} />
                            </button>
                          ) : (
                            <button
                              aria-label={`获取完整手机号 ${lead.phoneMasked}`}
                              className="inline-icon-button"
                              disabled={revealingPhone}
                              onClick={() => revealPhone(lead)}
                              title="获取完整手机号"
                              type="button"
                            >
                              {revealingPhone ? (
                                <LoaderCircle
                                  aria-hidden="true"
                                  className="is-spinning"
                                  size={14}
                                />
                              ) : (
                                <Eye aria-hidden="true" size={14} />
                              )}
                            </button>
                          )
                        ) : null}
                      </div>
                      {phoneError ? (
                        <span className="lead-inline-error" role="alert">
                          {phoneError}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <strong>{formatDateTime(lead.inCompanyTime)}</strong>
                  </td>
                  <td>{formatLeadOrigin(lead.channelType)}</td>
                  <td>
                    <strong>{lead.intentionArea}</strong>
                    <span>{lead.city}</span>
                  </td>
                  <td>{lead.leadStage}</td>
                  <td>{lead.latestFollowUser || "未分配"}</td>
                  <td>{formatPossibleJoin(lead.possibleJoin)}</td>
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
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lead-card-list">
        {leads.map((lead) => {
          const displayedPhone =
            revealedPhones[lead.id] || lead.phoneMasked;
          const phoneError = phoneErrors[lead.id];
          const revealingPhone = Boolean(busyPhoneIds[lead.id]);

          return (
            <article className="lead-card" key={lead.id}>
              <button
                className="lead-card__main"
                onClick={() => onSelect(lead)}
                type="button"
              >
                <span className="lead-card__topline">
                  <strong>
                    {lead.cyfDriverId ? `ID ${lead.cyfDriverId}` : lead.name}
                  </strong>
                  <StatusBadge state={lead.syncState} />
                </span>
                <span className="lead-card__phone">{displayedPhone}</span>
                <span className="lead-card__meta">
                  <span>
                    {lead.city} · {lead.intentionArea}
                  </span>
                  <span>{lead.leadStage}</span>
                </span>
                <span className="lead-card__meta">
                  <span>流入 {formatDateTime(lead.inCompanyTime)}</span>
                  <span>来源 {formatLeadOrigin(lead.channelType)}</span>
                </span>
                <span className="lead-card__footer">
                  <span>{formatLinkStatus(lead.latestLinkStatus)}</span>
                  <span>{formatPossibleJoin(lead.possibleJoin)}</span>
                  <span>跟进人 {lead.latestFollowUser || "未分配"}</span>
                </span>
              </button>

              <div className="lead-card__actions">
                {lead.cyfDriverId ? (
                  <button
                    aria-label={`复制司机ID ${lead.cyfDriverId}`}
                    className="compact-action"
                    onClick={() =>
                      copyValue(String(lead.cyfDriverId), "司机 ID 已复制。")
                    }
                    type="button"
                  >
                    <Copy aria-hidden="true" size={14} />
                    复制 ID
                  </button>
                ) : null}
                {onRevealPhone ? (
                  revealedPhones[lead.id] ? (
                    <button
                      aria-label={`复制完整手机号 ${displayedPhone}`}
                      className="compact-action"
                      onClick={() =>
                        copyValue(displayedPhone, "手机号已复制。")
                      }
                      type="button"
                    >
                      <Copy aria-hidden="true" size={14} />
                      复制手机号
                    </button>
                  ) : (
                    <button
                      aria-label={`获取完整手机号 ${lead.phoneMasked}`}
                      className="compact-action"
                      disabled={revealingPhone}
                      onClick={() => revealPhone(lead)}
                      type="button"
                    >
                      {revealingPhone ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="is-spinning"
                          size={14}
                        />
                      ) : (
                        <Eye aria-hidden="true" size={14} />
                      )}
                      {revealingPhone ? "获取中" : "获取手机号"}
                    </button>
                  )
                ) : null}
              </div>
              {phoneError ? (
                <span className="lead-inline-error" role="alert">
                  {phoneError}
                </span>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
