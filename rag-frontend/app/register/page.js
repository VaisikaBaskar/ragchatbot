"use client";

import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Settings2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Ensure role has a fallback and is logged safely
    const submissionData = {
      ...formData,
      role: formData.role || "user"
    };

    console.log("ROLE SELECTED:", submissionData.role);

    try {
      const res = await api.post("/auth/register", submissionData);
      if (res.data.success) {
        toast.success("Account created successfully!");
        router.push("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/10">
            <Settings2 className="text-blue-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-zinc-400 text-sm mt-2">Join to unleash RAG power</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              placeholder="Jane Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">Account Role</label>
            <select
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user" className="text-black">Standard User</option>
              <option value="admin" className="text-black">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
