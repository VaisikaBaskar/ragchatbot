"use client";

import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { Send, Bot, User, LogOut, Rocket } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { maskPII } from "@/utils/piiMasker";

import ChatSidebar from "../../components/ChatSidebar";

const formatResponse = (text) => {
  if (!text) return [];
  
  // remove markdown symbols
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#+/g, "");

  // split lines and filter empty
  const lines = cleaned.split("\n").filter(line => line.trim() !== "");

  return lines;
};

export default function ChatPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your RAG assistant. How can I help you today?", sources: [] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [uploadStats, setUploadStats] = useState({ uploadCount: 0, uploadLimit: 5, isPro: false });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch user info to populate upload stats
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/backend/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setUploadStats({
            uploadCount: data.data.uploadCount || 0,
            uploadLimit: data.data.uploadLimit || 5,
            isPro: data.data.isPro || false
          });
        }
      } catch (err) {
        console.error("Failed to fetch user stats", err);
      }
    };
    fetchUserStats();
  }, []);

  const handleUploadClick = () => {
    if (
      uploadStats.uploadCount >= uploadStats.uploadLimit &&
      !uploadStats.isPro &&
      user?.role !== "admin"
    ) {
      setShowUpgradeModal(true);
      return;
    }
    handleUpload();
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById("fileUpload");
    if (!fileInput) return;
    const file = fileInput.files[0];

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const toastId = toast.loading("Uploading document...");

    try {
      const res = await fetch("/backend/rag/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Uploaded successfully", { id: toastId });
        fileInput.value = ""; // clear input
        setUploadStats(prev => ({ ...prev, uploadCount: prev.uploadCount + 1 }));
      } else {
        if (data.upgradeRequired) {
          toast.dismiss(toastId);
          setShowUpgradeModal(true);
          return;
        }
        
        if (data.message === "LIMIT_REACHED" || (data.message && data.message.includes("Upload limit"))) {
          toast.dismiss(toastId);
          setShowUpgradeModal(true);
        } else {
          toast.error("Upload failed: " + (data.message || "Unknown error"), { id: toastId });
        }
      }
    } catch (err) {
      toast.error("Upload failed due to network error", { id: toastId });
    }
  };

  const loadChat = async (chatId) => {
    try {
      const res = await api.get(`/chat/${chatId}`);
      if (res.data && res.data.success) {
        setMessages(res.data.chat.messages || []);
        setActiveChatId(chatId);
      }
    } catch (err) {
      toast.error("Failed to load chat history");
    }
  };

  const handleNewChat = () => {
    setMessages([{ role: "assistant", content: "Hello! I am your RAG assistant. How can I help you today?", sources: [] }]);
    setActiveChatId(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // We keep a copy for the API call but mask it for the UI state
    const rawInput = input;
    const userMessage = { role: "user", content: maskPII(input) };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/rag/chat", { 
        query: rawInput, 
        chatId: activeChatId 
      });
      const data = res.data;
      if (data.blocked) {
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: data.answer, 
          type: "warning" 
        }]);
        setLoading(false);
        return;
      }

      const answer = data?.data?.answer || data?.answer || "I received a response but the format was unexpected.";
      const sources = data?.data?.sources || data?.sources || [];
      const newChatId = data?.chatId;

      // Double safety masking on the frontend
      const sanitizedAnswer = maskPII(answer);

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: sanitizedAnswer, 
        sources 
      }]);
      
      if (newChatId && newChatId !== activeChatId) {
        setActiveChatId(newChatId);
      }
    } catch (err) {
      toast.error("Failed to fetch response");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-950 font-sans">
        <ChatSidebar 
          onSelectChat={loadChat} 
          onNewChat={handleNewChat} 
          activeChatId={activeChatId} 
        />
        
        <div className="flex-1 flex flex-col relative w-full bg-zinc-950">
          {/* Removed Decorative Background to prevent mobile GPU blur bugs */}
        
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md z-10 w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Bot className="text-purple-400" size={20} />
            </div>
            <div>
              <h1 className="text-white font-semibold flex items-center gap-2">
                RAG Assistant
                {user?.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/20">Admin</span>
                )}
              </h1>
              <p className="text-zinc-400 text-sm sm:text-xs">Powered by Antigravity</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 p-4 sm:p-6 z-10 w-full overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === "user" ? "bg-purple-600" : "bg-white/10 border border-white/10"
                }`}>
                  {msg.role === "user" ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                
                <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[80%] min-w-0`}>
                  <div className={`p-4 rounded-2xl w-full ${
                    msg.role === "user" 
                      ? "bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-900/20 rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-zinc-100 backdrop-blur-sm rounded-tl-none"
                  }`}>
                    <div className="text-base sm:text-sm break-words">
                      {formatResponse(msg.content).length === 1 ? (
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {formatResponse(msg.content)[0]}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {formatResponse(msg.content).map((line, i) => (
                            <div key={i} className="flex gap-2 mb-1">
                              <span className="text-purple-400 shrink-0">•</span>
                              <span className="leading-relaxed break-words">{line.trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sources Badge */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.sources.map((src, sIdx) => (
                        <span key={sIdx} className="text-xs sm:text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono flex-wrap break-all">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-2 rounded-tl-none">
                  <div className="h-4 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 w-full shrink-0 z-20">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {/* File Upload UI */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <input 
                  type="file" 
                  id="fileUpload" 
                  className="w-full sm:w-auto text-sm sm:text-xs text-zinc-400 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm sm:file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-400 hover:file:bg-purple-600/30" 
                />
                <button 
                  onClick={handleUploadClick} 
                  className={`px-4 py-2 w-full sm:w-auto text-white text-sm sm:text-xs font-semibold rounded-full border border-white/10 text-center ${
                    uploadStats.uploadCount >= uploadStats.uploadLimit && !uploadStats.isPro && user?.role !== "admin"
                      ? "bg-zinc-700/50 hover:bg-zinc-700 cursor-pointer"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Upload Document
                </button>
              </div>
              {/* Upload limits tracker for standard users */}
              {user?.role !== "admin" && (
                <div className="w-full sm:w-auto text-center sm:text-left text-sm sm:text-xs font-medium text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  Uploads used: <span className={uploadStats.uploadCount >= uploadStats.uploadLimit && !uploadStats.isPro ? "text-red-400 font-bold" : "text-white"}>{uploadStats.uploadCount}</span> / {uploadStats.isPro ? "∞" : uploadStats.uploadLimit}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="relative w-full flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Message RAG Assistant..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-14 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 rounded-xl bg-purple-600 text-white disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-center text-xs sm:text-[10px] text-zinc-500">
              AI responses may generate inaccurate summaries. Verify sources when necessary.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl text-center space-y-6 max-w-sm w-full relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
              <Rocket className="text-purple-400" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Upgrade Required 🚀</h2>
              <p className="text-sm text-zinc-400">
                You've reached your free limit of <span className="text-white font-medium">{uploadStats.uploadLimit} document uploads</span>. Upgrade to continue.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push("/pricing")}
                className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl"
              >
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-zinc-500 text-sm font-medium py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
