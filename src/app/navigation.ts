import {
  BarChart3,
  BookUser,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../auth/permissions";
import type { PageId } from "../domain/navigation";

export interface NavigationItem {
  id: PageId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  requiredRole?: UserRole;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "今日工作台",
    shortLabel: "工作台",
    icon: LayoutDashboard,
  },
  { id: "leads", label: "线索管理", shortLabel: "线索", icon: ListChecks },
  {
    id: "offline",
    label: "线下线索",
    shortLabel: "线下",
    icon: BookUser,
  },
  {
    id: "reports",
    label: "统计与导出",
    shortLabel: "统计",
    icon: BarChart3,
    requiredRole: "admin",
  },
  {
    id: "sync",
    label: "同步状态",
    shortLabel: "同步",
    icon: RefreshCw,
    requiredRole: "admin",
  },
  {
    id: "accounts",
    label: "账号管理",
    shortLabel: "账号",
    icon: Users,
    requiredRole: "admin",
  },
];

export function getNavigationItems(role: UserRole): NavigationItem[] {
  return navigationItems.filter(
    (item) => !item.requiredRole || item.requiredRole === role,
  );
}
