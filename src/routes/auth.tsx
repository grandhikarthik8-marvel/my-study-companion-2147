import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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

  async function handleSubmit(mode: "login" | "signup") {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
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
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="min-h-11">Login</TabsTrigger>
              <TabsTrigger value="signup" className="min-h-11">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-3">
              <Field id="login-email" label="Email" type="email" value={email} onChange={setEmail} />
              <Field id="login-password" label="Password" type="password" value={password} onChange={setPassword} />
              <Button className="min-h-12 w-full" disabled={loading} onClick={() => handleSubmit("login")}>
                {loading ? "Please wait…" : "Log in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-3">
              <Field id="signup-name" label="Full name" value={fullName} onChange={setFullName} />
              <Field id="signup-email" label="Email" type="email" value={email} onChange={setEmail} />
              <Field id="signup-password" label="Password" type="password" value={password} onChange={setPassword} />
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
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={type === "password" ? "current-password" : "on"}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12"
      />
    </div>
  );
}
