"use client";

import { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Parse user object securely from local memory OR attempt restore using mock fetch
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    Cookies.set("token", token, { sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    
    // Redirect logic based on JWT token payload
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("ROLE:", payload.role);
      localStorage.setItem("role", payload.role || "user");
      
      const targetRoute = payload.role === "admin" ? "/admin" : "/chat";
      if (typeof window !== "undefined" && window.location.hostname === "10.0.2.2") {
          window.location.href = targetRoute; // Fix emulator-specific chunk fetching deadlocks
      } else {
          router.push(targetRoute);
      }
    } catch (error) {
      console.error("Token decoding failed, defaulting to /chat", error);
      if (typeof window !== "undefined" && window.location.hostname === "10.0.2.2") {
          window.location.href = "/chat";
      } else {
          router.push("/chat");
      }
    }
  };

  const logout = () => {
    Cookies.remove("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
