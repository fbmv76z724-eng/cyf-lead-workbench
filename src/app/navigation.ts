import {
  BarChart3,
  BookUser,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { PageId } from "../domain/navigation";

export interface NavigationItem {
  id: PageId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
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
  { id: "reports", label: "统计与导出", shortLabel: "统计", icon: BarChart3 },
  { id: "sync", label: "同步状态", shortLabel: "同步", icon: RefreshCw },
];
