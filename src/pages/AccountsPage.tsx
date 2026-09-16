import { useState, type FormEvent } from "react";
import { Plus, ShieldCheck, UserRound, X } from "lucide-react";
import type { UserProfile, UserRole } from "../auth/permissions";
import type { CreateAccountInput } from "../data/repository";
import { Button } from "../components/Button";

interface AccountsPageProps {
  profiles: UserProfile[];
  loading?: boolean;
  error?: string;
  onUpdate: (
    profile: UserProfile,
    changes: Pick<UserProfile, "role" | "active">,
  ) => Promise<void>;
  onCreate: (input: CreateAccountInput) => Promise<void>;
}

export function AccountsPage({
  profiles,
  loading = false,
  error = "",
  onUpdate,
  onCreate,
}: AccountsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAccountInput>({
    email: "",
    displayName: "",
    password: "",
    role: "sales",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!form.displayName.trim() || !form.email.trim() || !form.password) {
      setFormError("请填写姓名、邮箱和初始密码。");
      return;
    }
    if (form.password.length < 8) {
      setFormError("初始密码至少需要 8 位。");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        ...form,
        displayName: form.displayName.trim(),
        email: form.email.trim(),
      });
      setForm({ email: "", displayName: "", password: "", role: "sales" });
      setShowForm(false);
    } catch {
      setFormError("账号创建失败，请检查邮箱是否已存在。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">权限与状态</p>
          <h1>账号管理</h1>
          <p>管理员可调整账号角色和启用状态。</p>
        </div>
        <Button
          icon={<Plus aria-hidden="true" size={17} />}
          onClick={() => setShowForm(true)}
          variant="primary"
        >
          新增账号
        </Button>
      </header>

      {error ? (
        <div className="inline-notice inline-notice--warning" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel" aria-labelledby="accounts-title">
        <div className="panel-heading">
          <div>
            <h2 id="accounts-title">工作台账号</h2>
            <p>{loading ? "正在加载" : `共 ${profiles.length} 个账号`}</p>
          </div>
        </div>

        {profiles.length ? (
          <div className="table-wrap">
            <table className="data-table account-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>账号 ID</th>
                  <th>角色</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <span className="account-identity">
                        {profile.role === "admin" ? (
                          <ShieldCheck aria-hidden="true" size={17} />
                        ) : (
                          <UserRound aria-hidden="true" size={17} />
                        )}
                        <strong>{profile.displayName || "未命名账号"}</strong>
                      </span>
                    </td>
                    <td>
                      <code>{profile.id}</code>
                    </td>
                    <td>
                      <label>
                        <span className="sr-only">
                          角色 - {profile.displayName}
                        </span>
                        <select
                          aria-label={`角色 - ${profile.displayName}`}
                          onChange={(event) =>
                            void onUpdate(profile, {
                              role: event.target.value as UserRole,
                              active: profile.active,
                            })
                          }
                          value={profile.role}
                        >
                          <option value="admin">管理员</option>
                          <option value="sales">业务员</option>
                        </select>
                      </label>
                    </td>
                    <td>
                      <label className="toggle-field">
                        <input
                          aria-label={`启用 - ${profile.displayName}`}
                          checked={profile.active}
                          onChange={(event) =>
                            void onUpdate(profile, {
                              role: profile.role,
                              active: event.target.checked,
                            })
                          }
                          type="checkbox"
                        />
                        <span>{profile.active ? "已启用" : "已停用"}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-copy">
            {loading ? "正在读取账号..." : "当前没有可管理的账号。"}
          </p>
        )}
      </section>

      {showForm ? (
        <div className="drawer-layer">
          <button
            aria-label="关闭新增账号"
            className="drawer-backdrop"
            onClick={() => setShowForm(false)}
            type="button"
          />
          <section
            aria-labelledby="account-form-title"
            aria-modal="true"
            className="lead-drawer lead-drawer--form"
            role="dialog"
          >
            <header className="drawer-header">
              <div>
                <p className="eyebrow">Supabase Auth</p>
                <h2 id="account-form-title">新增账号</h2>
              </div>
              <button
                aria-label="关闭新增账号"
                className="icon-button"
                onClick={() => setShowForm(false)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <form className="drawer-scroll" onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span>姓名 *</span>
                  <input
                    aria-label="账号姓名"
                    onChange={(event) =>
                      setForm({ ...form, displayName: event.target.value })
                    }
                    value={form.displayName}
                  />
                </label>
                <label className="field">
                  <span>邮箱 *</span>
                  <input
                    aria-label="账号邮箱"
                    autoComplete="email"
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    type="email"
                    value={form.email}
                  />
                </label>
                <label className="field">
                  <span>初始密码 *</span>
                  <input
                    aria-label="初始密码"
                    autoComplete="new-password"
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    type="password"
                    value={form.password}
                  />
                </label>
                <label className="field">
                  <span>角色</span>
                  <select
                    aria-label="角色"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value as UserRole,
                      })
                    }
                    value={form.role}
                  >
                    <option value="sales">业务员</option>
                    <option value="admin">管理员</option>
                  </select>
                </label>
              </div>

              {formError ? (
                <p className="auth-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="form-actions">
                <Button onClick={() => setShowForm(false)}>取消</Button>
                <Button disabled={saving} type="submit" variant="primary">
                  {saving ? "创建中" : "创建账号"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
