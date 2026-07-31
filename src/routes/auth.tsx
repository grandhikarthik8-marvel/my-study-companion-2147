import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — My Study Companion" },
      { name: "description", content: "Log in or create your My Study Companion account." },
      { property: "og:title", content: "Sign in — My Study Companion" },
      { property: "og:description", content: "Log in or create your My Study Companion account." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"credentials" | "forgot">("credentials");

  async function handleSubmit(kind: "login" | "signup") {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (kind === "signup" && fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (kind === "login") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          toast.success("Account created!");
          navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success("Check your inbox to confirm your email.");
        }
      }
    } catch (error) {
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent", { description: "Check your inbox to set a new password." });
      setMode("credentials");
    } catch (error) {
      toast.error("Could not send the reset link", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(String(result.error));
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error("Google sign-in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src={logo} alt="My Study Companion logo" width={816} height={816} className="mx-auto h-20 w-20" />
          <h1 className="mt-3 text-xl font-bold text-foreground">My Study Companion</h1>
          <p className="text-sm text-muted-foreground">Build the Habit. Achieve the Dream.</p>
        </div>

        <Card className="p-5">
          {mode === "forgot" ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Reset your password</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll email you a secure link to choose a new password.
                </p>
              </div>
              <Field id="forgot-email" label="Email" type="email" value={email} onChange={setEmail} />
              <Button className="min-h-12 w-full" disabled={loading} onClick={handleForgot}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 w-full"
                disabled={loading}
                onClick={() => setMode("credentials")}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="min-h-11">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="min-h-11">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-4 space-y-3">
                  <Field id="login-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field
                    id="login-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                  />
                  <Button className="min-h-12 w-full" disabled={loading} onClick={() => handleSubmit("login")}>
                    {loading ? "Please wait…" : "Log in"}
                  </Button>
                  <button
                    type="button"
                    className="w-full py-2 text-sm text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </TabsContent>

                <TabsContent value="signup" className="mt-4 space-y-3">
                  <Field id="signup-name" label="Full name" value={fullName} onChange={setFullName} />
                  <Field id="signup-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field
                    id="signup-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                  />
                  <Button className="min-h-12 w-full" disabled={loading} onClick={() => handleSubmit("signup")}>
                    {loading ? "Please wait…" : "Create account"}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="secondary" className="min-h-12 w-full" disabled={loading} onClick={handleGoogle}>
                Continue with Google
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          value={value}
          autoComplete={autoComplete ?? (isPassword ? "current-password" : "on")}
          onChange={(e) => onChange(e.target.value)}
          className={isPassword ? "min-h-12 pr-12" : "min-h-12"}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}
