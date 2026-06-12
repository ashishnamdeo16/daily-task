import {
  Activity, BarChart3, BookOpen, Brain, Briefcase, Calendar, CalendarCheck,
  Check, ChevronLeft, ChevronRight, Circle, CircleDot, Clock, Code2, Dumbbell,
  Flame, GitMerge, GitPullRequest, LayoutDashboard, LayoutTemplate, Layers,
  ListTodo, Loader2, Menu, Minus, Moon, PenLine, Plus, Settings, Sparkles, Sun,
  Target, Timer, Trash2, TrendingUp, Trophy, Users, X, Zap, Pencil, Play, Pause,
  Square, Bell, BellRing, Award, Pin, ChevronDown, MoreVertical, type LucideProps,
} from "lucide-react";

const ICONS = {
  Activity, BarChart3, BookOpen, Brain, Briefcase, Calendar, CalendarCheck,
  Check, ChevronLeft, ChevronRight, Circle, CircleDot, Clock, Code2, Dumbbell,
  Flame, GitMerge, GitPullRequest, LayoutDashboard, LayoutTemplate, Layers,
  ListTodo, Loader2, Menu, Minus, Moon, PenLine, Plus, Settings, Sparkles, Sun,
  Target, Timer, Trash2, TrendingUp, Trophy, Users, X, Zap, Pencil, Play, Pause,
  Square, Bell, BellRing, Award, Pin, ChevronDown, MoreVertical,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = ICONS[name as IconName] ?? Circle;
  return <Cmp {...props} />;
}
