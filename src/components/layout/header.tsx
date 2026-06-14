"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Flame, Menu, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar";
import { Progress } from "@/components/ui/progress";
import { getLevelProgress } from "@/lib/xp";
import { ResetAccountButton } from "@/features/settings/components/reset-account-button";

interface HeaderProps {
  streak: number;
  xp: number;
  debt: number;
}

export function Header({ streak, xp, debt }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lvl = getLevelProgress(xp);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-500">
          <Flame className="h-4 w-4" />
          {streak}
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            day streak
          </span>
        </div>
        {debt > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
            <Activity className="h-4 w-4" />
            {debt}
            <span className="hidden text-xs font-normal sm:inline">debt</span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden w-40 flex-col gap-1 sm:flex">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="h-3 w-3 text-primary" /> Lv {lvl.level}
            </span>
            <span className="text-muted-foreground">
              {lvl.xpIntoLevel}/{lvl.xpForThisLevel}
            </span>
          </div>
          <Progress value={lvl.progress} className="h-1.5" />
        </div>

        <ThemeToggle />
        <ResetAccountButton />
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-[260px] translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:rounded-none">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
