"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import type { Settings } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/server/actions/settings.actions";
import { usePushNotifications } from "@/features/notifications/use-push";
import { ResetAccountButton } from "@/features/settings/components/reset-account-button";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3">{children}</div>;
}

export function SettingsClient({ settings }: { settings: Settings | null }) {
  const { theme, setTheme } = useTheme();
  const [pending, start] = useTransition();
  const push = usePushNotifications();

  function save(patch: Parameters<typeof updateSettings>[0]) {
    start(async () => {
      const res = await updateSettings(patch);
      if (res.success) toast.success("Saved");
      else toast.error(res.error);
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Tune LifeOS to your workflow.</p>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Reset all progress and start from scratch. Settings like theme and pomodoro length are kept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetAccountButton variant="settings" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="divide-y">
          <Row>
            <div>
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">Light, dark, or follow your system.</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Behaviour</CardTitle></CardHeader>
        <CardContent className="divide-y">
          <Row>
            <div>
              <Label>Carry debt forward</Label>
              <p className="text-xs text-muted-foreground">Unfinished work rolls into the next day.</p>
            </div>
            <Switch
              defaultChecked={settings?.autoCarryDebt ?? true}
              disabled={pending}
              onCheckedChange={(v) => save({ autoCarryDebt: v })}
            />
          </Row>
          <Row>
            <div>
              <Label>Alarm sound</Label>
              <p className="text-xs text-muted-foreground">Play a looping alarm when focus ends.</p>
            </div>
            <Switch
              defaultChecked={settings?.enableAlarmSound ?? true}
              disabled={pending}
              onCheckedChange={(v) => save({ enableAlarmSound: v })}
            />
          </Row>
          <Row>
            <div>
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">Reminders and achievement alerts.</p>
            </div>
            <Switch
              defaultChecked={settings?.enableNotifications ?? true}
              disabled={pending}
              onCheckedChange={(v) => save({ enableNotifications: v })}
            />
          </Row>
          <Row>
            <div>
              <Label>Push notifications</Label>
              <p className="text-xs text-muted-foreground">
                Install the PWA and enable browser push for end-of-day reminders.
              </p>
            </div>
            <Button
              size="sm"
              variant={push.status === "subscribed" ? "secondary" : "outline"}
              disabled={push.status === "loading" || push.status === "unsupported"}
              onClick={async () => {
                const wasSubscribed = push.status === "subscribed";
                const res = wasSubscribed ? await push.unsubscribe() : await push.subscribe();
                if (res.ok) toast.success(wasSubscribed ? "Push disabled" : "Push enabled");
                else toast.error(res.error);
              }}
            >
              <Bell className="h-4 w-4" />
              {push.status === "subscribed" ? "Enabled" : "Enable push"}
            </Button>
          </Row>
          <Row>
            <div>
              <Label>End-of-day hour</Label>
              <p className="text-xs text-muted-foreground">When the review reminder appears (24h).</p>
            </div>
            <Input
              type="number"
              min={0}
              max={23}
              className="w-20"
              defaultValue={settings?.endOfDayHour ?? 21}
              disabled={pending}
              onBlur={(e) => save({ endOfDayHour: Number(e.target.value) })}
            />
          </Row>
          <Row>
            <div>
              <Label>Pomodoro length</Label>
              <p className="text-xs text-muted-foreground">Default focus minutes.</p>
            </div>
            <Input
              type="number"
              min={1}
              max={120}
              className="w-20"
              defaultValue={settings?.pomodoroMinutes ?? 25}
              disabled={pending}
              onBlur={(e) => save({ pomodoroMinutes: Number(e.target.value) })}
            />
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}
