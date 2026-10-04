"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Standardize admin access through the main unified login flow
    // Redirection happens automatically based on the 'role' in the JWT payload
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="text-purple-500 animate-spin" size={40} />
      <p className="text-zinc-500 text-sm font-medium animate-pulse">
        Redirecting to secure login...
      </p>
    </div>
  );
}
