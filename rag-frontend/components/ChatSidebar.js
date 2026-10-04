import { useEffect, useState } from "react";
import { PlusCircle, MessageSquare } from "lucide-react";
import api from "../lib/api";

export default function ChatSidebar({ onSelectChat, onNewChat, activeChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await api.get("/chat/list");
      if (res.data && res.data.success) {
        setChats(res.data.chats);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [activeChatId]); // Refetch if active chat changes (new chats created)

  return (
    <div className="w-64 bg-zinc-950/50 backdrop-blur-md border-r border-white/10 flex flex-col h-screen hidden sm:flex shrink-0 z-20">
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 transition-colors font-medium text-sm"
        >
          <PlusCircle size={16} />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="p-3 space-y-1">
          {loading ? (
            <div className="text-zinc-500 text-xs text-center py-4">Loading history...</div>
          ) : chats.length === 0 ? (
            <div className="text-zinc-500 text-xs text-center py-4">No recent chats</div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  activeChatId === chat._id
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="text-xs font-medium truncate block">
                  {chat.title || "New Chat"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
