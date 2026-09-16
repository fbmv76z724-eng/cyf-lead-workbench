import { useState } from "react";
import { Plus, UserRoundPlus } from "lucide-react";
import type { Lead, LocalFollowStatus } from "../domain/lead";
import type { CreateOfflineLeadInput } from "../data/repository";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime } from "../utils/format";

interface OfflineLeadsPageProps {
  leads: Lead[];
  onCreate: (input: CreateOfflineLeadInput) => Lead;
  onFollowUp: (lead: Lead) => void;
}

const defaultForm: CreateOfflineLeadInput = {
  name: "",
  phone: "",
  city: "凉山彝族自治州",
  intentionArea: "西昌市",
  channelType: "线下",
  localStatus: "待跟进",
  remark: "",
};

export function OfflineLeadsPage({
  leads,
  onCreate,
  onFollowUp,
}: OfflineLeadsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const offlineLeads = leads.filter((lead) => lead.source === "offline");

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "请输入姓名";
    if (!/^1\d{10}$/.test(form.phone)) nextErrors.phone = "请输入 11 位手机号";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onCreate(form);
    setForm(defaultForm);
    setShowForm(false);
  };

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">仅本地保存</p>
          <h1>线下线索</h1>
          <p>用于记录门店、转介绍等尚未进入 CYF 的线索。</p>
        </div>
        <Button
          icon={<Plus aria-hidden="true" size={17} />}
          onClick={() => setShowForm(true)}
          variant="primary"
        >
          新增线下线索
        </Button>
      </header>

      <section className="panel" aria-labelledby="offline-list-title">
        <div className="panel-heading">
          <div>
            <h2 id="offline-list-title">本地线索列表</h2>
            <p>{offlineLeads.length} 条，不会自动写回 CYF</p>
          </div>
        </div>

        <div className="offline-list">
          {offlineLeads.map((lead) => (
            <article className="offline-item" key={lead.id}>
              <span className="offline-item__icon">
                <UserRoundPlus aria-hidden="true" size={20} />
              </span>
              <div className="offline-item__identity">
                <strong>{lead.name}</strong>
                <span>{lead.phoneMasked}</span>
              </div>
              <div>
                <span className="field-label">区域</span>
                <strong>{lead.intentionArea}</strong>
              </div>
              <div>
                <span className="field-label">本地状态</span>
                <strong>{lead.localStatus}</strong>
              </div>
              <div>
                <span className="field-label">最近跟进</span>
                <strong>{formatDateTime(lead.latestFollowAt)}</strong>
              </div>
              <StatusBadge state={lead.syncState} />
              <Button onClick={() => onFollowUp(lead)}>跟进</Button>
            </article>
          ))}
        </div>
      </section>

      {showForm ? (
        <div className="drawer-layer">
          <button
            aria-label="关闭新增线下线索"
            className="drawer-backdrop"
            onClick={() => setShowForm(false)}
            type="button"
          />
          <section
            aria-labelledby="offline-form-title"
            aria-modal="true"
            className="lead-drawer lead-drawer--form"
            role="dialog"
          >
            <header className="drawer-header">
              <div>
                <p className="eyebrow">本地记录</p>
                <h2 id="offline-form-title">新增线下线索</h2>
              </div>
            </header>
            <div className="drawer-scroll">
              <div className="form-grid">
                <label className="field">
                  <span>姓名 *</span>
                  <input
                    aria-label="姓名"
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    value={form.name}
                  />
                  {errors.name ? <small className="field-error">{errors.name}</small> : null}
                </label>
                <label className="field">
                  <span>手机号 *</span>
                  <input
                    aria-label="手机号"
                    inputMode="numeric"
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    value={form.phone}
                  />
                  {errors.phone ? (
                    <small className="field-error">{errors.phone}</small>
                  ) : null}
                </label>
                <label className="field">
                  <span>城市</span>
                  <input
                    onChange={(event) =>
                      setForm({ ...form, city: event.target.value })
                    }
                    value={form.city}
                  />
                </label>
                <label className="field">
                  <span>期望区域</span>
                  <input
                    onChange={(event) =>
                      setForm({ ...form, intentionArea: event.target.value })
                    }
                    value={form.intentionArea}
                  />
                </label>
                <label className="field">
                  <span>渠道</span>
                  <select
                    onChange={(event) =>
                      setForm({ ...form, channelType: event.target.value })
                    }
                    value={form.channelType}
                  >
                    <option value="线下">线下</option>
                    <option value="转介绍">转介绍</option>
                    <option value="门店">门店</option>
                  </select>
                </label>
                <label className="field">
                  <span>本地状态</span>
                  <select
                    onChange={(event) =>
                      setForm({
                        ...form,
                        localStatus: event.target.value as LocalFollowStatus,
                      })
                    }
                    value={form.localStatus}
                  >
                    <option value="待跟进">待跟进</option>
                    <option value="跟进中">跟进中</option>
                    <option value="已跟进">已跟进</option>
                    <option value="无效">无效</option>
                    <option value="成交">成交</option>
                  </select>
                </label>
                <label className="field field--full">
                  <span>备注</span>
                  <textarea
                    onChange={(event) =>
                      setForm({ ...form, remark: event.target.value })
                    }
                    rows={3}
                    value={form.remark}
                  />
                </label>
              </div>
              <div className="form-actions">
                <Button onClick={() => setShowForm(false)}>取消</Button>
                <Button onClick={submit} variant="primary">
                  保存
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
