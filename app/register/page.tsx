"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import { api } from "@/lib/api-client";
import type { RegisterFormData } from "@/types/user";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      toast.error("Please fill out all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.auth.register(username, password, username);
      toast.success("Registered successfully");
      // Log the new user straight in, then send them to the app.
      const res = await signIn("credentials", { username, password, redirect: false });
      if (res?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-20 w-screen bg-cover bg-center flex items-center justify-center p-5"
      style={{ backgroundImage: "url('/images/login.png')", fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
    >
      <div className="backdrop-blur-md bg-white/5 p-8 text-center w-full max-w-xl border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-xl transition-transform duration-300 hover:scale-105">
        <h1 className="text-black font-bold text-3xl mb-2">Welcome to Finding Nibbles!</h1>
        <p className="text-gray-700 mb-6 text-lg">Create your account to start discovering amazing food</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange}
            className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 rounded-lg border border-white/30 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C47B4D] focus:bg-white/20 transition-all duration-200" required />
          <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleChange}
            className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 rounded-lg border border-white/30 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C47B4D] focus:bg-white/20 transition-all duration-200" required />
          <input type="password" name="password" placeholder="Password (min. 6 characters)" value={formData.password} onChange={handleChange}
            className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 rounded-lg border border-white/30 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C47B4D] focus:bg-white/20 transition-all duration-200" required minLength={6} />
          <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange}
            className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 rounded-lg border border-white/30 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C47B4D] focus:bg-white/20 transition-all duration-200" required />

          <button type="submit" disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#C47B4D] hover:bg-[#A35F35] focus:outline-none focus:ring-2 focus:ring-[#C47B4D] focus:ring-offset-2 transform hover:scale-105"
            }`}>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                Creating account...
              </div>
            ) : (
              "Register"
            )}
          </button>

          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">{error}</div>}

          <p className="text-white text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-300 hover:text-blue-100 hover:underline font-semibold transition-colors">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
