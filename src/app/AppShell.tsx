import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import type { UserProfile } from "../auth/permissions";
import type { PageId } from "../domain/navigation";
import { getNavigationItems } from "./navigation";

interface AppShellProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  profile?: UserProfile;
  onSignOut?: () => Promise<void>;
  children: ReactNode;
}

export function AppShell({
  currentPage,
  onNavigate,
  profile,
  onSignOut,
  children,
}: AppShellProps) {
  const visibleNavigation = getNavigationItems(profile?.role ?? "admin");

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">司</span>
          <span>
            <strong>司服线索台</strong>
            <small>CYF Workbench</small>
          </span>
        </div>

        <nav className="side-nav" aria-label="主导航">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="nav-item"
                data-active={currentPage === item.id}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={19} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-account">
          <span className="status-dot status-dot--success" />
          <span className="sidebar-account__identity">
            <strong>{profile?.displayName || "开发管理员"}</strong>
            <small>{profile?.role === "sales" ? "业务员" : "管理员"}</small>
          </span>
          {onSignOut ? (
            <button
              aria-label="退出登录"
              className="inline-icon-button"
              onClick={onSignOut}
              title="退出登录"
              type="button"
            >
              <LogOut aria-hidden="true" size={15} />
            </button>
          ) : null}
        </div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav className="bottom-nav" aria-label="移动端主导航">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              aria-current={currentPage === item.id ? "page" : undefined}
              className="bottom-nav__item"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={21} strokeWidth={1.9} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
