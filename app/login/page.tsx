"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import { AuthShell } from "@/components/auth/AuthShell";
import { GradientButton } from "@/components/ui/GradientButton";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("Please enter your username/email and password.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const res = await signIn("credentials", { identifier, password, redirect: false });
      if (res?.error) {
        setError(res.error);
        return;
      }
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where your appetite left off."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-bold text-[var(--terracotta)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Username or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={onKey}
          fullWidth
          autoFocus
          autoComplete="username"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKey}
          fullWidth
          autoComplete="current-password"
        />

        {error && (
          <div className="rounded-xl border border-[var(--paprika)]/30 bg-[var(--paprika)]/10 px-4 py-3 text-sm font-semibold text-[var(--paprika)]">
            {error}
          </div>
        )}

        <GradientButton size="large" fullWidth onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </GradientButton>
      </div>
    </AuthShell>
  );
}
