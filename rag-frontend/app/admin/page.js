"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  Trash2, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  Search,
  Loader2,
  ArrowLeft,
  Activity
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, docsRes, usersRes, chatsRes, activityRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/documents"),
        api.get("/admin/users"),
        api.get("/admin/chats"),
        api.get("/admin/activity-logs")
      ]);

      setAnalytics(analyticsRes?.data?.analytics || null);
      setDocuments(docsRes?.data?.documents || []);
      setUsers(usersRes?.data?.users || []);
      setChats(chatsRes?.data?.logs || []);
      setActivityLogs(activityRes?.data?.logs || []);
    } catch (err) {
      console.error("[ADMIN_FETCH_ERROR]", err);
      toast.error("Failed to load some administration data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm("Are you sure you want to delete this document and all its embeddings?")) return;
    try {
      await api.delete(`/admin/document/${id}`);
      setDocuments(documents.filter(d => d._id !== id));
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleUpgradeUser = async (id) => {
    try {
      await api.patch(`/admin/user/${id}/upgrade`);
      setUsers(users.map(u => u._id === id ? { ...u, isPro: true, uploadLimit: 9999 } : u));
      toast.success("User upgraded to Pro");
    } catch (err) {
      toast.error("Failed to upgrade user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Remove this user permanently?")) return;
    try {
      await api.delete(`/admin/user/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success("User removed");
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="text-purple-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-black/40 border-r border-white/10 flex flex-col p-6 space-y-8 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <ShieldCheck className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Admin</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Control Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "users", label: "Users", icon: Users },
              { id: "chats", label: "Chat Logs", icon: MessageSquare },
              { id: "activity", label: "Activity Logs", icon: ShieldCheck },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === btn.id 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <btn.icon size={18} />
                {btn.label}
              </button>
            ))}
          </nav>

          <button 
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mt-auto"
          >
            <ArrowLeft size={16} />
            Back to Chat
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
          {/* Background Blurs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
            
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-blue-400" },
                    { label: "Pro Users", value: analytics.proUsers, icon: Zap, color: "text-yellow-400" },
                    { label: "Total Documents", value: analytics.totalDocs, icon: FileText, color: "text-green-400" },
                    { label: "Total Chats", value: analytics.totalChats, icon: MessageSquare, color: "text-purple-400" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors">
                      <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 ${stat.color}`}>
                        <stat.icon size={24} />
                      </div>
                      <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
                      <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="text-purple-400" />
                    System Status
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 text-sm text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Service</span>
                      <span>Status</span>
                      <span>Uptime</span>
                    </div>
                    {[
                      { name: "RAG Pipeline", status: "Operational", uptime: "99.9%" },
                      { name: "Auth Service", status: "Operational", uptime: "100%" },
                      { name: "Storage Service", status: "Operational", uptime: "99.8%" },
                    ].map((svc, i) => (
                      <div key={i} className="grid grid-cols-3 items-center py-2 border-t border-white/5">
                        <span className="font-medium">{svc.name}</span>
                        <span className="flex items-center gap-2 text-green-400">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {svc.status}
                        </span>
                        <span>{svc.uptime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold">Document Management</h2>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Filename</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Uploaded By</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Date</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {documents.map((doc) => (
                        <tr key={doc._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium">{doc.fileName}</td>
                          <td className="px-6 py-4 text-zinc-400">{doc.uploadedBy?.email || "System"}</td>
                          <td className="px-6 py-4 text-zinc-500 text-sm">{new Date(doc.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteDoc(doc._id)}
                              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold">User Management</h2>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Email</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">Uploads</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">Plan</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {user.email}
                            {user.role === "admin" && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">Admin</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-mono">{user.uploadCount} / {user.uploadLimit}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.isPro ? (
                              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20 font-bold uppercase tracking-wider font-mono">PRO 🚀</span>
                            ) : (
                              <span className="text-[10px] bg-white/10 text-zinc-500 px-2 py-1 rounded-full font-bold uppercase tracking-wider font-mono">Free</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {!user.isPro && user.role !== "admin" && (
                              <button 
                                onClick={() => handleUpgradeUser(user._id)}
                                className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                                title="Upgrade to Pro"
                              >
                                <Zap size={18} />
                              </button>
                            )}
                            {user.role !== "admin" && (
                              <button 
                                onClick={() => handleDeleteUser(user._id)}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Delete User"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "chats" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold">Chat Log Monitoring</h2>
                </div>
                
                <div className="space-y-4">
                  {chats.map((log) => (
                    <div key={log._id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-purple-400">
                            {log.userId?.name?.charAt(0) || "U"}
                          </div>
                          <span className="text-sm font-medium">{log.userId?.email || "Unknown User"}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono italic">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Question</p>
                          <p className="text-sm text-zinc-100 italic">"{log.query}"</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Generated Answer</p>
                          <p className="text-sm text-zinc-300 line-clamp-3">{log.response}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold">System Activity Logs</h2>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {activityLogs.length === 0 && (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-3xl text-zinc-500">
                      No activity logs found.
                    </div>
                  )}
                  {activityLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`p-5 rounded-2xl border transition-all ${
                        log?.action === "BLOCKED_QUERY" 
                        ? "bg-red-500/10 border-red-500/20 text-red-100 shadow-lg shadow-red-900/10" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            log?.action === "BLOCKED_QUERY" ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"
                          }`}>
                            {log?.action?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">{log?.action || "Unknown Action"}</p>
                            <p className="text-[10px] opacity-60 font-mono italic">
                              {log?.timestamp ? new Date(log.timestamp).toLocaleString() : "Unknown Time"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-zinc-300">{log?.userId?.email || "System/Unknown"}</p>
                          <p className="text-[10px] text-zinc-500 font-mono lowercase">IP: {log?.ip || "N/A"}</p>
                        </div>
                      </div>
                      {log?.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                         <div className="mt-4 text-[10px] bg-black/40 p-3 rounded-xl font-mono text-zinc-400 border border-white/5">
                            <span className="text-zinc-500 mr-2">CONTEXT:</span>
                            {JSON.stringify(log.metadata)}
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
