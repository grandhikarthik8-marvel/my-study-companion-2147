import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AppShell } from "@/components/common/AppShell";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useStudyData";
import { markAllNotificationsRead } from "@/services/studyService";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — My Study Companion" },
      { name: "description", content: "Badge unlocks, goal wins and streak updates in one place." },
      { property: "og:title", content: "Notifications — My Study Companion" },
      { property: "og:description", content: "Badge unlocks, goal wins and streak updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const items = notifications.data ?? [];

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All caught up");
    } catch (error) {
      toast.error("Could not update notifications", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <AppShell
      header={
        <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-xl font-bold text-foreground">Notifications</h1>
          <Button variant="secondary" size="sm" className="min-h-11 shrink-0" onClick={handleMarkAll}>
            Mark all read
          </Button>
        </header>
      }
    >
      {notifications.isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No notifications yet. Finish a session to earn your first badge!
        </Card>
      ) : (
        items.map((n) => (
          <Card key={n.id} className={`p-4 ${n.is_read ? "opacity-70" : "border-primary/40"}`}>
            <div className="flex items-start gap-3">
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
    </AppShell>
  );
}
