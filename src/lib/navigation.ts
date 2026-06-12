export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  group: "core" | "modes" | "system";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", group: "core" },
  { label: "Focus", href: "/focus", icon: "Timer", group: "core" },
  { label: "Streaks", href: "/streaks", icon: "Flame", group: "core" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3", group: "core" },
  { label: "Weekly", href: "/weekly", icon: "Target", group: "core" },
  { label: "Templates", href: "/templates", icon: "LayoutTemplate", group: "core" },
  { label: "Achievements", href: "/achievements", icon: "Trophy", group: "core" },

  { label: "Job Search", href: "/modes/job-search", icon: "Briefcase", group: "modes" },
  { label: "Open Source", href: "/modes/open-source", icon: "GitPullRequest", group: "modes" },
  { label: "AI Builder", href: "/modes/ai-builder", icon: "Brain", group: "modes" },

  { label: "Settings", href: "/settings", icon: "Settings", group: "system" },
];

export const NAV_GROUPS: { id: NavItem["group"]; label: string }[] = [
  { id: "core", label: "Workspace" },
  { id: "modes", label: "Modes" },
  { id: "system", label: "System" },
];
