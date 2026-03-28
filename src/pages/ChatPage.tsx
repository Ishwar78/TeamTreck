import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, API_BASE } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Paperclip, Image as ImageIcon, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
// const messageSound = new Audio("/sounds/notification.mp3");
// messageSound.volume = 1;


const ChatPage = () => {
  const { token, user } = useAuth();
const prevMessageLengthRef = useRef(0);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; type: "user" | "group" } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchParams] = useSearchParams();
  const groupIdParam = searchParams.get("groupId");
  const userIdParam = searchParams.get("userId");

  const [counts, setCounts] = useState<{ unreadDirect: any[], totalSent: any[], groupCounts: any[] }>({ unreadDirect: [], totalSent: [], groupCounts: [] });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessageCountRef = useRef(0);
  const lastSoundTriggerRef = useRef(0);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);


  const chatContainerRef = useRef<HTMLDivElement>(null);
const isUserAtBottomRef = useRef(true);
const [showScrollBtn, setShowScrollBtn] = useState(false);

const [unreadCount, setUnreadCount] = useState(0);
  /* ================= AUTO SCROLL ================= */
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const threshold = 100;

    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    isUserAtBottomRef.current = isAtBottom;

    // 🔥 button show/hide
    setShowScrollBtn(!isAtBottom);
  };

  container.addEventListener("scroll", handleScroll);

  return () => container.removeEventListener("scroll", handleScroll);
}, []);

useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const prevLength = prevMessageLengthRef.current;
  const currentLength = messages.length;

  // 🔥 check: kya actual new message aaya?
  const hasNewMessage = currentLength > prevLength;

  if (isUserAtBottomRef.current) {
    container.scrollTop = container.scrollHeight;

    setUnreadCount(0);
    setShowScrollBtn(false);
  } else if (hasNewMessage) {
    // ✅ sirf new message pe hi count badhega
    setUnreadCount((prev) => prev + (currentLength - prevLength));
    setShowScrollBtn(true);
  }

  prevMessageLengthRef.current = currentLength;
}, [messages]);
  /* ================= LOAD MESSAGES ================= */
  const loadMessages = async (chat: { id: string; type: "user" | "group" }) => {
  if (!chat || !chat.id) return;

  try {
    const endpoint =
      chat.type === "group"
        ? `/api/chat/group/${chat.id}`
        : `/api/chat/${chat.id}`;

    const data = await apiFetch(endpoint, token);
    setMessages(data?.messages || []);

  } catch (err) {
    console.error("LOAD MESSAGE ERROR:", err);
  }
};












  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;

      try {
        // Fetch Peers (Fellow group members + Admin)
        const peersData = await apiFetch("/api/chat/peers", token);
        if (peersData?.users) {
          setUsers(peersData.users);
        }

        // Fetch Groups (Admin sees all, others see joining)
        const groupsEndpoint = (user.role === "company_admin" || user.role === "sub_admin") 
          ? "/api/company/groups" 
          : "/api/company/my-groups";
          
        const groupsData = await apiFetch(groupsEndpoint, token);
        if (groupsData?.groups) {
          setGroups(groupsData.groups);
        }

        // Fetch Summary Counts
        const summaryData = await apiFetch("/api/chat/summary", token);
        if (summaryData.success) {
          setCounts(summaryData);
        }
      } catch (err) {
        console.error("FETCH ERROR:", err);
      }
    };

    fetchData();
    const countInterval = setInterval(fetchData, 4000); // Poll every 4s for global unread counts
    return () => clearInterval(countInterval);
  }, [token, user]);


  /* ================= HANDLE DEEP LINKING ================= */
  useEffect(() => {
    if (groups.length > 0 && groupIdParam && !activeChat) {
      const targetGroup = groups.find(g => g._id === groupIdParam);
      if (targetGroup) {
        setActiveChat({ id: targetGroup._id, name: targetGroup.name, type: "group" });
        loadMessages({ id: targetGroup._id, type: "group" });
        markAsSeen({ id: targetGroup._id, type: "group" });
      }
    } else if (users.length > 0 && userIdParam && !activeChat) {
      const targetUser = users.find(u => u._id === userIdParam);
      if (targetUser) {
        setActiveChat({ id: targetUser._id, name: targetUser.name, type: "user" });
        loadMessages({ id: targetUser._id, type: "user" });
        markAsSeen({ id: targetUser._id, type: "user" });
      }
    }
  }, [groups, users, groupIdParam, userIdParam, activeChat]);



useEffect(() => {
  // Initialize audio and unlock on first click
  messageSoundRef.current = new Audio("/sounds/notification.mp3");
  messageSoundRef.current.volume = 1;

  const unlockAudio = () => {
    if (messageSoundRef.current) {
      messageSoundRef.current.play().then(() => {
        messageSoundRef.current?.pause();
        messageSoundRef.current!.currentTime = 0;
        document.removeEventListener('click', unlockAudio);
      }).catch(() => {});
    }
  };
  document.addEventListener('click', unlockAudio);
  return () => document.removeEventListener('click', unlockAudio);
}, []);

const triggerSound = (source: string) => {
  const now = Date.now();
  if (now - lastSoundTriggerRef.current < 1000) return; // Cooldown 1s
  lastSoundTriggerRef.current = now;

  console.log(`🔥 [SOUND] Triggered by ${source}`);
  if (messageSoundRef.current) {
    messageSoundRef.current.currentTime = 0;
    messageSoundRef.current.play().catch(e => {
      console.log("🔥 [SOUND] Play failed:", e);
    });
  }
};

/* ================= NEW MESSAGE SOUND TRIGGER (ACTIVE CHAT) ================= */
useEffect(() => {
  if (!activeChat) {
    lastMessageCountRef.current = 0;
    return;
  }

  if (messages.length === 0) {
    lastMessageCountRef.current = 0;
    return;
  }

  // 🔥 INITIAL LOAD SKIP (Avoid sound on page entry or chat switch)
  if (lastMessageCountRef.current === 0) {
    lastMessageCountRef.current = messages.length;
    console.log("🔥 [CHATPAGE] First messages loaded, staying silent.");
    return;
  }

  // Check if we have new messages (count increased)
  if (messages.length > lastMessageCountRef.current) {
    const lastMsg = messages[messages.length - 1];
    const senderId = typeof lastMsg.sender === 'object' 
      ? (lastMsg.sender?._id || lastMsg.sender?.id) 
      : lastMsg.sender;
    
    const isMyMsg = senderId && user?.id && String(senderId) === String(user.id);
    
    console.log("🔥 [CHATPAGE] Check result:", { isMyMsg, senderId, myId: user?.id });

    if (!isMyMsg) {
      triggerSound("ActiveChat_NewMessage");
    }
  }
  lastMessageCountRef.current = messages.length;
}, [messages, activeChat, user?.id]);


const testNotification = () => {
  triggerSound("TestButton");
};




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

  const markAsSeen = async (chat: { id: string, type: "user" | "group" }) => {
    if (!token || !chat.id) return;
    try {
      const endpoint = chat.type === "group" ? `/api/chat/mark-group-seen/${chat.id}` : `/api/chat/mark-seen/${chat.id}`;
      await apiFetch(endpoint, token, { method: "POST" });
      
      // Refresh counts
      const summaryData = await apiFetch("/api/chat/summary", token);
      if (summaryData.success) setCounts(summaryData);
    } catch (err) {
      console.error("Mark seen error", err);
    }
  };

  const renderMessageContent = (msg: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return msg.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200 break-all">
            {part}
          </a>
        );
      }
      return part;
    });
  };

 const formatMessageDate = (dateStr: string) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

  const isEmployeeDashboard = user?.role === "employee" || user?.role === "user" || user?.role === "intern";


  const content = (
    <div className="flex h-[calc(100vh-80px)] mt-6 rounded-xl overflow-hidden bg-[#0b1220] border border-gray-800">

      {/* ================= SIDEBAR ================= */}
      <div className="w-1/4 overflow-y-auto border-r border-gray-800 bg-[#0f172a] flex flex-col">
        
        {/* DIRECT MESSAGES */}
        <div className="p-3 flex justify-between items-center border-b border-gray-800/50">
          <span className="text-gray-400 text-xs uppercase">
            {isEmployeeDashboard ? "Team" : "Employees"}
          </span>
          {/* <button 
            onClick={testNotification}
            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 opacity-70 hover:opacity-100 transition"
          >
            Test Sound
          </button> */}
        </div>

        
        {users.map((u) => {
          const unread = counts.unreadDirect.find(c => (c._id === u._id || c._id === u.id))?.count || 0;

          return (
            <div
              key={u._id}
              onClick={() => {
                setActiveChat({ id: u._id, name: u.name, type: "user" });
                setMessages([]);
                loadMessages({ id: u._id, type: "user" });
                markAsSeen({ id: u._id, type: "user" });
              }}
              className={`px-4 py-3 cursor-pointer flex justify-between items-center ${
                activeChat?.id === u._id
                  ? "bg-blue-600/20 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span>{u.name}</span>
              <div className="flex gap-2">
                {unread > 0 && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unread}</span>}
              </div>
            </div>
          );
        })}

        {/* GROUPS */}
        {groups.length > 0 && (
          <>
            <div className="p-3 text-gray-400 text-xs mt-4">GROUPS</div>
            {groups.map((g) => {
              // Group unread is currently just total count for info, making it less prominent
              const gCount = counts.groupCounts.find(c => c._id === g._id)?.count || 0;
              return (
                <div
                  key={g._id}
                  onClick={() => {
                    setActiveChat({ id: g._id, name: g.name, type: "group" });
                    setMessages([]);
                    loadMessages({ id: g._id, type: "group" });
                    markAsSeen({ id: g._id, type: "group" });
                  }}
                  className={`px-4 py-3 cursor-pointer flex justify-between items-center ${
                    activeChat?.id === g._id
                      ? "bg-blue-600/20 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs opacity-80">#</div>
                    {g.name}
                  </div>
                  {/* For groups, we don't have per-user unread tracking yet, so showing total is optional */}
                </div>
              );
            })}
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
        {/* <div className="flex-1 overflow-y-auto p-4 space-y-4"> */}
        <div
  ref={chatContainerRef}
  className="flex-1 overflow-y-auto p-4 space-y-4 relative"
>
          {!activeChat ? (
            <div className="text-center text-gray-500 mt-20">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              No messages yet
            </div>
          ) : null}

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
                    {m.message && <div>{renderMessageContent(m.message)}</div>}
                    
                    {/* Timestamp */}
                    <div className={`text-[9px] mt-1 opacity-60 text-right leading-none`}>
                      {formatMessageDate(m.createdAt)}
                    </div>
                  </div>

              </div>
            );
          })}

          <div ref={bottomRef}></div>
          
         {showScrollBtn && (
  <button
    onClick={() => {
      const container = chatContainerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });

      setShowScrollBtn(false);
      setUnreadCount(0); // reset count
    }}
    className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full shadow-lg transition flex items-center gap-2"
  >
    ↓
    {unreadCount > 0 && (
      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
        {unreadCount}
      </span>
    )}
  </button>
)}
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