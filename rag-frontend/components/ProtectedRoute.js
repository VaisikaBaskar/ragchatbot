"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Restricted page access
        setTimeout(() => {
          if (user.role === "admin") router.push("/admin");
          else router.push("/chat");
        }, 100);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
