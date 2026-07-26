import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Study Companion — Build the Habit. Achieve the Dream." },
      {
        name: "description",
        content:
          "Track study sessions, hit daily goals and keep your streak alive with My Study Companion.",
      },
      { property: "og:title", content: "My Study Companion" },
      { property: "og:description", content: "Build the habit. Achieve the dream." },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => setProgress((p) => Math.min(95, p + 12)), 120);
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setProgress(100);
      setTimeout(() => {
        navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
      }, 350);
    })();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <img src={logo} alt="My Study Companion logo" width={816} height={816} className="mx-auto h-32 w-32" />
        <h1 className="mt-6 text-2xl font-bold text-foreground">My Study Companion</h1>
        <p className="mt-2 text-sm text-muted-foreground">Build the Habit. Achieve the Dream.</p>
        <div className="mx-auto mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
