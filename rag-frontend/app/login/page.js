"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Zap } from "lucide-react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Login button clicked, initiating request...");
    
    try {
      // API instance now automatically detects whether to use localhost or 10.0.2.2
      const res = await api.post("/auth/login", formData);
      console.log("Login response received:", res.data);

      if (res.data.success) {
        toast.success("Welcome back!");
        login(res.data.token, res.data.data);
        // Next.js Navigation AbortError fix: routing is already handled securely inside the AuthContext `login` function.
      }
    } catch (err) {
      console.error("Login failed:", err);
      toast.error(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/10">
            <Zap className="text-purple-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
          <p className="text-zinc-400 text-sm mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
