import { useEffect, useRef, useState } from "react";
import { Eye, Phone, X } from "lucide-react";
import type { UserProfile } from "../auth/permissions";
import type { FollowUp, FollowUpInput } from "../domain/followUp";
import {
  LINK_STATUS_LABELS,
  POSSIBLE_JOIN_LABELS,
  type Lead,
  type LinkStatus,
  type PossibleJoin,
} from "../domain/lead";
import { formatDateTime, formatFullDate } from "../utils/format";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

interface LeadDetailDrawerProps {
  lead?: Lead;
  open: boolean;
  history: FollowUp[];
  onClose: () => void;
  onSubmitFollowUp: (input: FollowUpInput) => Promise<void>;
  onRevealPhone: (lead: Lead) => Promise<string | undefined>;
  owners?: UserProfile[];
  onAssign?: (leadId: string, ownerId: string | null) => Promise<void>;
}

interface FormState {
  linkStatus: "" | 0 | 1 | 2 | 3;
  possibleJoin: "" | PossibleJoin;
  remarkType: string;
  remark: string;
  calledAt: string;
}

const initialForm: FormState = {
  linkStatus: "",
  possibleJoin: "",
  remarkType: "",
  remark: "",
  calledAt: new Date().toISOString().slice(0, 16),
};

export function LeadDetailDrawer({
  lead,
  open,
  history,
  onClose,
  onSubmitFollowUp,
  onRevealPhone,
  owners = [],
  onAssign,
}: LeadDetailDrawerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [revealedPhone, setRevealedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [revealingPhone, setRevealingPhone] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    headingRef.current?.focus();
    setForm(initialForm);
    setErrors({});
    setFeedback("");
    setRevealedPhone("");
    setPhoneError("");
    setRevealingPhone(false);
    setAssigning(false);
    setAssignmentFeedback("");
  }, [open, lead?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !lead) return null;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (form.linkStatus === "") nextErrors.linkStatus = "请选择外呼状态";
    if (form.possibleJoin === "") nextErrors.possibleJoin = "请选择加盟意向";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFeedback("");
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmitFollowUp({
        leadId: lead.id,
        calledAt: new Date(form.calledAt).toISOString(),
        linkStatus: form.linkStatus as 0 | 1 | 2 | 3,
        possibleJoin: form.possibleJoin as PossibleJoin,
        remarkType: form.remarkType || undefined,
        remark: form.remark,
        operatorName: "当前用户",
      });
      setFeedback("跟进记录已保存，等待同步到 CYF。");
      setForm(initialForm);
    } catch {
      setFeedback("保存失败，请重试。记录不会丢失。");
    } finally {
      setSaving(false);
    }
  };

  const revealPhone = async () => {
    if (revealingPhone) return;

    setPhoneError("");
    setRevealingPhone(true);
    try {
      const value = await onRevealPhone(lead);
      if (!value) {
        setPhoneError("暂未获取到完整号码，请重试");
        return;
      }
      setRevealedPhone(value);
    } catch {
      setPhoneError("获取手机号失败，请重试");
    } finally {
      setRevealingPhone(false);
    }
  };

  const assignLead = async (ownerId: string) => {
    if (!onAssign || assigning) return;
    setAssignmentFeedback("");
    setAssigning(true);
    try {
      await onAssign(lead.id, ownerId || null);
      setAssignmentFeedback(ownerId ? "负责人已更新。" : "线索已释放到待认领池。");
    } catch {
      setAssignmentFeedback("负责人更新失败，请重试。");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="drawer-layer">
      <button
        aria-label="关闭线索详情"
        className="drawer-backdrop"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="lead-detail-title"
        aria-modal="true"
        className="lead-drawer"
        role="dialog"
      >
        <header className="drawer-header">
          <div>
            <p className="eyebrow">
              {lead.source === "cyf" ? "CYF 同步线索" : "仅本地线索"}
            </p>
            <h2 id="lead-detail-title" ref={headingRef} tabIndex={-1}>
              {lead.cyfDriverId ? `司机 ID ${lead.cyfDriverId}` : lead.name}
            </h2>
          </div>
          <button
            aria-label="关闭线索详情"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div className="drawer-scroll">
          <div className="detail-summary">
            <div>
              <span>手机号</span>
              <strong>{revealedPhone || lead.phoneMasked}</strong>
              {!revealedPhone ? (
                <button
                  className="text-button"
                  disabled={revealingPhone}
                  onClick={revealPhone}
                  type="button"
                >
                  <Eye aria-hidden="true" size={15} />
                  {revealingPhone
                    ? "获取中"
                    : phoneError
                      ? "重试获取"
                      : "查看完整号码"}
                </button>
              ) : null}
              {phoneError ? (
                <small className="field-error" role="alert">
                  {phoneError}
                </small>
              ) : null}
            </div>
            <div>
              <span>城市 / 区域</span>
              <strong>
                {lead.city} · {lead.intentionArea}
              </strong>
            </div>
            <div>
              <span>流入时间</span>
              <strong>{formatFullDate(lead.inCompanyTime)}</strong>
            </div>
            <div>
              <span>同步状态</span>
              <StatusBadge state={lead.syncState} />
            </div>
          </div>

          {onAssign ? (
            <div className="assignment-bar">
              <label className="field">
                <span>负责人</span>
                <select
                  aria-label="负责人"
                  disabled={assigning}
                  onChange={(event) => void assignLead(event.target.value)}
                  value={lead.ownerId ?? ""}
                >
                  <option value="">待认领</option>
                  {owners
                    .filter((owner) => owner.active)
                    .map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.displayName} ·{" "}
                        {owner.role === "admin" ? "管理员" : "业务员"}
                      </option>
                    ))}
                </select>
              </label>
              {assignmentFeedback ? (
                <small role="status">{assignmentFeedback}</small>
              ) : null}
            </div>
          ) : null}

          {lead.syncState === "conflict" ? (
            <div className="inline-notice inline-notice--warning" role="status">
              CYF 上的记录已更新，本地提交需要重新确认。
            </div>
          ) : null}

          <section className="drawer-section" aria-labelledby="call-history-title">
            <div className="section-heading">
              <h3 id="call-history-title">跟进记录</h3>
              <span>{history.length} 条</span>
            </div>
            {history.length ? (
              <div className="timeline">
                {history.map((item) => (
                  <article className="timeline-item" key={item.id}>
                    <span className="timeline-item__dot" />
                    <div>
                      <strong>
                        {LINK_STATUS_LABELS[item.linkStatus]} ·{" "}
                        {POSSIBLE_JOIN_LABELS[item.possibleJoin]}
                      </strong>
                      <span>
                        {formatDateTime(item.calledAt)} · {item.operatorName}
                      </span>
                      {item.remark ? <p>{item.remark}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-copy">暂时没有跟进记录。</p>
            )}
          </section>

          <section className="drawer-section call-form" aria-labelledby="new-call-title">
            <div className="section-heading">
              <h3 id="new-call-title">新增外呼</h3>
              <span>保存后自动进入同步队列</span>
            </div>

            {Object.keys(errors).length ? (
              <div className="error-summary" role="alert" tabIndex={-1}>
                <strong>请先完善以下信息</strong>
                <ul>
                  {Object.entries(errors).map(([key, message]) => (
                    <li key={key}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="form-grid">
              <label className="field">
                <span>外呼状态 *</span>
                <select
                  aria-invalid={Boolean(errors.linkStatus)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      linkStatus: event.target.value
                        ? (Number(event.target.value) as 0 | 1 | 2 | 3)
                        : "",
                    })
                  }
                  value={form.linkStatus}
                >
                  <option value="">请选择</option>
                  {([0, 1, 2, 3] as LinkStatus[]).map((value) => (
                    <option key={value} value={value}>
                      {LINK_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
                {errors.linkStatus ? (
                  <small className="field-error">{errors.linkStatus}</small>
                ) : null}
              </label>

              <label className="field">
                <span>加盟意向 *</span>
                <select
                  aria-invalid={Boolean(errors.possibleJoin)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      possibleJoin: event.target.value
                        ? (Number(event.target.value) as PossibleJoin)
                        : "",
                    })
                  }
                  value={form.possibleJoin}
                >
                  <option value="">请选择</option>
                  {Object.entries(POSSIBLE_JOIN_LABELS)
                    .filter(([code]) => Number(code) >= 0)
                    .map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                </select>
                {errors.possibleJoin ? (
                  <small className="field-error">{errors.possibleJoin}</small>
                ) : null}
              </label>

              <label className="field">
                <span>外呼时间</span>
                <input
                  onChange={(event) =>
                    setForm({ ...form, calledAt: event.target.value })
                  }
                  type="datetime-local"
                  value={form.calledAt}
                />
              </label>

              <label className="field">
                <span>备注标签</span>
                <select
                  onChange={(event) =>
                    setForm({ ...form, remarkType: event.target.value })
                  }
                  value={form.remarkType}
                >
                  <option value="">不选择标签</option>
                  <option value="已加微信">已加微信</option>
                  <option value="友商司机">友商司机</option>
                  <option value="驾龄不足3年">驾龄不足 3 年</option>
                  <option value="年龄不足22岁">年龄不足 22 岁</option>
                </select>
              </label>

              <label className="field field--full">
                <span>跟进备注</span>
                <textarea
                  maxLength={200}
                  onChange={(event) =>
                    setForm({ ...form, remark: event.target.value })
                  }
                  placeholder="记录本次沟通结果和下次行动"
                  rows={3}
                  value={form.remark}
                />
              </label>
            </div>

            {feedback ? (
              <p className="form-feedback" role="status">
                {feedback}
              </p>
            ) : null}

            <div className="form-actions">
              <Button onClick={onClose}>取消</Button>
              <Button
                disabled={saving}
                icon={<Phone aria-hidden="true" size={16} />}
                onClick={handleSubmit}
                variant="primary"
              >
                {saving ? "保存中" : "保存跟进"}
              </Button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
