import type { ReactNode } from "react";
import type { PageId } from "../domain/navigation";
import { navigationItems } from "./navigation";

interface AppShellProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
}

export function AppShell({
  currentPage,
  onNavigate,
  children,
}: AppShellProps) {
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
          {navigationItems.map((item) => {
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

        <div className="sidebar-status">
          <span className="status-dot status-dot--success" />
          <span>
            <strong>连接器在线</strong>
            <small>2 分钟前完成同步</small>
          </span>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav className="bottom-nav" aria-label="移动端主导航">
        {navigationItems.map((item) => {
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
