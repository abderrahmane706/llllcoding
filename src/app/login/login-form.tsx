"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Try again.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md p-8 rounded-2xl border border-neon-blue/30 space-y-6"
        style={{
          background: "rgba(10,5,15,0.9)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 40px rgba(0,229,255,0.1), inset 0 1px 0 rgba(0,229,255,0.1)",
        }}
      >
        <div className="text-center space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em]">System Access</p>
          <h1 className="text-3xl font-black font-orbitron text-neon-blue uppercase tracking-widest"
              style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}>
            Hunter Login
          </h1>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/20 border border-red-500/50 text-red-400 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-[0.2em] mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-black/60 border border-gray-800 focus:border-neon-blue rounded-lg px-4 py-3 text-sm text-white placeholder-gray-700 outline-none transition-all duration-200"
              placeholder="hunter@system.local"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-[0.2em] mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-black/60 border border-gray-800 focus:border-neon-blue rounded-lg px-4 py-3 text-sm text-white placeholder-gray-700 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black font-black font-orbitron uppercase tracking-widest transition-all text-sm disabled:opacity-50 hover-pulse-glow"
            style={{ boxShadow: loading ? "none" : "0 0 15px rgba(0,229,255,0.3)" }}
          >
            {loading ? "Authenticating..." : "Enter System"}
          </button>
        </form>
      </div>
    </div>
  );
}
