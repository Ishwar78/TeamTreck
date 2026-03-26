import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, API_BASE } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Paperclip, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatPage = () => {
  const { token, user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; type: "user" | "group" } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= LOAD MESSAGES ================= */
  const loadMessages = async (chat: { id: string; type: "user" | "group" }) => {
    if (!chat || !chat.id) return;
    try {
      const endpoint = chat.type === "group" ? `/api/chat/group/${chat.id}` : `/api/chat/${chat.id}`;
      const data = await apiFetch(endpoint, token);
      setMessages(data?.messages || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;

      try {
        // Fetch Peers (Fellow group members + Admin)
        const peersData = await apiFetch("/api/chat/peers", token);
        if (peersData?.users) {
          setUsers(peersData.users);
          
          // Auto-select first chat if none active
          if (!activeChat && peersData.users.length > 0) {
            const first = peersData.users[0];
            setActiveChat({ id: first._id, name: first.name, type: "user" });
            loadMessages({ id: first._id, type: "user" });
          }
        }

        // Fetch Groups (Admin sees all, others see joining)
        const groupsEndpoint = (user.role === "company_admin" || user.role === "sub_admin") 
          ? "/api/company/groups" 
          : "/api/company/my-groups";
          
        const groupsData = await apiFetch(groupsEndpoint, token);
        if (groupsData?.groups) {
          setGroups(groupsData.groups);
        }
      } catch (err) {
        console.error("FETCH ERROR:", err);
      }
    };

    fetchData();
  }, [token, user]);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    if (!activeChat) return;

    const interval = setInterval(() => {
      loadMessages(activeChat);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeChat]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (fileData?: { url: string, type: string }) => {
    if (!text.trim() && !fileData && !activeChat) return;

    const newMsg = {
      sender: { _id: user?.id, name: user?.name },
      message: text,
      fileUrl: fileData?.url,
      fileType: fileData?.type
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const body: any = { 
        message: text,
        fileUrl: fileData?.url,
        fileType: fileData?.type
      };
      if (activeChat!.type === "group") {
        body.groupId = activeChat!.id;
      } else {
        body.receiver = activeChat!.id;
      }

      await apiFetch("/api/chat/send", token, {
        method: "POST",
        body,
      });

      loadMessages(activeChat!);
    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    setText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/chat/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        sendMessage({ url: data.fileUrl, type: data.fileType });
      }
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isEmployeeDashboard = user?.role === "employee" || user?.role === "user" || user?.role === "intern";

  const content = (
    <div className="flex h-[calc(100vh-80px)] mt-6 rounded-xl overflow-hidden bg-[#0b1220] border border-gray-800">

      {/* ================= SIDEBAR ================= */}
      <div className="w-1/4 overflow-y-auto border-r border-gray-800 bg-[#0f172a] flex flex-col">
        
        {/* DIRECT MESSAGES */}
        <div className="p-3 text-gray-400 text-xs mt-2 uppercase">
          {isEmployeeDashboard ? "Team" : "Employees"}
        </div>
        
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => {
              setActiveChat({ id: u._id, name: u.name, type: "user" });
              setMessages([]);
              loadMessages({ id: u._id, type: "user" });
            }}
            className={`px-4 py-3 cursor-pointer ${
              activeChat?.id === u._id
                ? "bg-blue-600/20 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {u.name}
          </div>
        ))}

        {/* GROUPS */}
        {groups.length > 0 && (
          <>
            <div className="p-3 text-gray-400 text-xs mt-4">GROUPS</div>
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => {
                  setActiveChat({ id: g._id, name: g.name, type: "group" });
                  setMessages([]);
                  loadMessages({ id: g._id, type: "group" });
                }}
                className={`px-4 py-3 cursor-pointer flex items-center gap-2 ${
                  activeChat?.id === g._id
                    ? "bg-blue-600/20 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs opacity-80">
                  #
                </div>
                {g.name}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 text-white bg-[#0f172a] font-medium flex items-center gap-2">
          {activeChat?.type === 'group' && <span className="text-gray-400">#</span>}
          {activeChat?.name || "Select a chat"}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              No messages yet
            </div>
          )}

          {messages.map((m, i) => {
            const isMe = m.sender === user?.id || m.sender?._id === user?.id;
            const senderName = typeof m.sender === 'object' ? m.sender?.name : "User";

            return (
              <div
                key={i}
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {/* Show sender name for group chats if not me */}
                {activeChat?.type === "group" && !isMe && (
                  <span className="text-xs text-gray-400 ml-1 mb-1">
                    {senderName}
                  </span>
                )}
                  <div
                    className={`rounded-xl max-overflow-hidden ${
                      isMe
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    } ${m.fileUrl ? "p-1" : "px-4 py-2"} max-w-xs`}
                  >
                    {m.fileUrl && (
                      <div className="mb-1">
                        {m.fileType?.startsWith("image/") ? (
                          <img 
                            src={`${API_BASE}${m.fileUrl}`} 
                            alt="Chat attachment" 
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 min-h-[100px]"
                            onClick={() => window.open(`${API_BASE}${m.fileUrl}`, '_blank')}
                          />
                        ) : (
                          <a 
                            href={`${API_BASE}${m.fileUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 hover:bg-white/10 rounded"
                          >
                            <Paperclip size={16} />
                            <span className="text-sm underline truncate">Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                    {m.message && <div>{m.message}</div>}
                  </div>
              </div>
            );
          })}

          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        {activeChat && (
          <div className="p-3 border-t border-gray-800 flex gap-2 bg-[#0f172a] items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
              title="Attach File"
            >
              <Paperclip size={20} className={uploading ? "animate-pulse" : ""} />
            </button>
            <input
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded outline-none border border-transparent focus:border-blue-500/50 transition"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!text.trim() && !uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-5 py-2 rounded transition font-medium"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!isEmployeeDashboard) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
};

export default ChatPage;