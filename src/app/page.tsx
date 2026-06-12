import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Activity,
  Brain,
  CalendarCheck,
  Flame,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  { icon: CalendarCheck, title: "Daily Kanban", desc: "Auto-generated days with Todo, In Progress, Completed & Skipped columns." },
  { icon: Flame, title: "Streak Engine", desc: "LeetCode-style streaks with a GitHub heatmap that keeps you honest." },
  { icon: Timer, title: "Focus Sessions", desc: "Pomodoro & custom timers with a mandatory, unmissable alarm." },
  { icon: Activity, title: "Debt System", desc: "Unfinished work rolls forward as visible debt. Nothing slips." },
  { icon: TrendingUp, title: "Analytics", desc: "Completion %, focus hours, streak & debt trends, goal progress." },
  { icon: Target, title: "Weekly Goals", desc: "Define your Top 3 every Sunday and map tasks to them." },
  { icon: Trophy, title: "XP & Achievements", desc: "Level up as you ship. Unlock milestones for real output." },
  { icon: Brain, title: "Builder Modes", desc: "Dedicated dashboards for Job Search, Open Source & AI projects." },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          {APP_NAME}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center md:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Your personal execution system
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight md:text-6xl">
            Stop planning your goals.
            <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
              {" "}
              Start executing them.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            {APP_NAME} turns job applications, DSA, open source, AI projects, networking
            and fitness into a daily system with streaks, debt, focus timers and ruthless
            accountability.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Build your system</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">I already have one</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {APP_NAME} — built for people who ship.
      </footer>
    </div>
  );
}
