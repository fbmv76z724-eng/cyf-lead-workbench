import { ShieldCheck, UserRound } from "lucide-react";
import type { UserProfile, UserRole } from "../auth/permissions";

interface AccountsPageProps {
  profiles: UserProfile[];
  loading?: boolean;
  error?: string;
  onUpdate: (
    profile: UserProfile,
    changes: Pick<UserProfile, "role" | "active">,
  ) => Promise<void>;
}

export function AccountsPage({
  profiles,
  loading = false,
  error = "",
  onUpdate,
}: AccountsPageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">权限与状态</p>
          <h1>账号管理</h1>
          <p>管理员可调整账号角色和启用状态。</p>
        </div>
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
    </div>
  );
}
