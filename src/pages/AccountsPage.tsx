import { useState, type FormEvent } from "react";
import { Pencil, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import type { UserProfile, UserRole } from "../auth/permissions";
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "../data/repository";
import { Button } from "../components/Button";

interface AccountsPageProps {
  profiles: UserProfile[];
  loading?: boolean;
  error?: string;
  onUpdate: (input: UpdateAccountInput) => Promise<void>;
  onCreate: (input: CreateAccountInput) => Promise<void>;
}

interface AccountFormState {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  active: boolean;
}

const emptyForm: AccountFormState = {
  email: "",
  displayName: "",
  password: "",
  role: "sales",
  active: true,
};

export function AccountsPage({
  profiles,
  loading = false,
  error = "",
  onUpdate,
  onCreate,
}: AccountsPageProps) {
  const [editingProfile, setEditingProfile] = useState<UserProfile>();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(editingProfile);

  const openCreate = () => {
    setEditingProfile(undefined);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (profile: UserProfile) => {
    setEditingProfile(profile);
    setForm({
      email: profile.email ?? "",
      displayName: profile.displayName,
      password: "",
      role: profile.role,
      active: profile.active,
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProfile(undefined);
    setFormError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!form.displayName.trim() || !form.email.trim()) {
      setFormError("请填写姓名和邮箱。");
      return;
    }
    if (!isEditing && form.password.length < 8) {
      setFormError("初始密码至少需要 8 位。");
      return;
    }
    if (isEditing && form.password && form.password.length < 8) {
      setFormError("新密码至少需要 8 位，留空则不修改密码。");
      return;
    }

    setSaving(true);
    try {
      if (editingProfile) {
        await onUpdate({
          id: editingProfile.id,
          email: form.email.trim(),
          displayName: form.displayName.trim(),
          password: form.password || undefined,
          role: form.role,
          active: form.active,
        });
      } else {
        await onCreate({
          email: form.email.trim(),
          displayName: form.displayName.trim(),
          password: form.password,
          role: form.role,
        });
      }
      closeForm();
    } catch {
      setFormError(
        isEditing
          ? "账号更新失败，请检查邮箱是否已存在。"
          : "账号创建失败，请检查邮箱是否已存在。",
      );
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
          <p>管理员可新增账号，并修改姓名、邮箱、角色、状态和登录密码。</p>
        </div>
        <Button
          icon={<Plus aria-hidden="true" size={17} />}
          onClick={openCreate}
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
                  <th>登录邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th aria-label="操作" />
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
                      <strong>{profile.email || "未设置邮箱"}</strong>
                      <code>{profile.id}</code>
                    </td>
                    <td>{profile.role === "admin" ? "管理员" : "业务员"}</td>
                    <td>{profile.active ? "已启用" : "已停用"}</td>
                    <td>
                      <Button
                        aria-label={`编辑账号 ${profile.displayName}`}
                        icon={<Pencil aria-hidden="true" size={15} />}
                        onClick={() => openEdit(profile)}
                      >
                        编辑
                      </Button>
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

      {formOpen ? (
        <div className="drawer-layer">
          <button
            aria-label={isEditing ? "关闭编辑账号" : "关闭新增账号"}
            className="drawer-backdrop"
            onClick={closeForm}
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
                <h2 id="account-form-title">
                  {isEditing ? "编辑账号" : "新增账号"}
                </h2>
              </div>
              <button
                aria-label={isEditing ? "关闭编辑账号" : "关闭新增账号"}
                className="icon-button"
                onClick={closeForm}
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
                  <span>登录邮箱 *</span>
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
                  <span>{isEditing ? "新密码" : "初始密码 *"}</span>
                  <input
                    aria-label={isEditing ? "新密码" : "初始密码"}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    placeholder={isEditing ? "留空则不修改密码" : ""}
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
                {isEditing ? (
                  <label className="toggle-field field--full">
                    <input
                      aria-label="账号启用状态"
                      checked={form.active}
                      onChange={(event) =>
                        setForm({ ...form, active: event.target.checked })
                      }
                      type="checkbox"
                    />
                    <span>{form.active ? "账号已启用" : "账号已停用"}</span>
                  </label>
                ) : null}
              </div>

              {formError ? (
                <p className="auth-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="form-actions">
                <Button onClick={closeForm}>取消</Button>
                <Button disabled={saving} type="submit" variant="primary">
                  {saving
                    ? "保存中"
                    : isEditing
                      ? "保存修改"
                      : "创建账号"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
