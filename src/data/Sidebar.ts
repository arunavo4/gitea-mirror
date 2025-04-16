import {
  LayoutDashboard,
  GitFork,
  Users,
  Settings,
  Activity,
} from "lucide-react";
import type { SidebarItem } from "@/types/Sidebar";

export const links: SidebarItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: GitFork },
  { href: "/organizations", label: "Organizations", icon: Users },
  { href: "/config", label: "Configuration", icon: Settings },
  { href: "/activity", label: "Activity Log", icon: Activity },
];
