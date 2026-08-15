"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import { api } from "@/lib/api-client";
import type { RegisterFormData } from "@/types/user";
import { AuthShell } from "@/components/auth/AuthShell";
import { GradientButton } from "@/components/ui/GradientButton";

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    const { username, email, password, confirmPassword } = form;
    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill in every field.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.auth.register(username, email, password, username);
      toast.success("Account created - welcome to the table!");
      const res = await signIn("credentials", { identifier: username, password, redirect: false });
      if (res?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Two minutes to a tastier decision - no credit card, no fuss."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[var(--terracotta)] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Username" name="username" value={form.username} onChange={change} onKeyDown={onKey} fullWidth autoFocus autoComplete="username" />
        <TextField label="Email" name="email" type="email" value={form.email} onChange={change} onKeyDown={onKey} fullWidth autoComplete="email" />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={change} onKeyDown={onKey} fullWidth autoComplete="new-password" helperText="At least 6 characters" />
        <TextField label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={change} onKeyDown={onKey} fullWidth autoComplete="new-password" />

        {error && (
          <div className="rounded-xl border border-[var(--paprika)]/30 bg-[var(--paprika)]/10 px-4 py-3 text-sm font-semibold text-[var(--paprika)]">
            {error}
          </div>
        )}

        <GradientButton size="large" fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </GradientButton>
      </div>
    </AuthShell>
  );
}
