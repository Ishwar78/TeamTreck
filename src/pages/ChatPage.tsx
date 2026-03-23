import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

const ChatPage = () => {
  const { token, user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= LOAD MESSAGES ================= */
  const loadMessages = async (id: string) => {
    if (!id) return;

    try {
      const data = await apiFetch(`/api/chat/${id}`, token);
      setMessages(data?.messages || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  };

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !user) return;

      try {
        // 🔥 EMPLOYEE → ONLY ADMIN
        if (user.role === "employee" || user.role === "user") {
          const data = await apiFetch("/api/chat/admin", token);

          if (data?.admin) {
            setUsers([data.admin]);
            setSelectedUser(data.admin);

            setTimeout(() => {
              loadMessages(data.admin._id);
            }, 100);
          }
        } else {
          // 🔥 ADMIN → EMPLOYEES
          const data = await apiFetch("/api/company/users", token);

          if (data?.users) {
            const employees = data.users.filter(
              (u: any) => u.role === "employee"
            );
            setUsers(employees);
          }
        }
      } catch (err) {
        console.error("USER FETCH ERROR:", err);
      }
    };

    fetchUsers();
  }, [token, user]);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    if (!selectedUser) return;

    const interval = setInterval(() => {
      loadMessages(selectedUser._id);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;

    const newMsg = {
      sender: user?.id,
      message: text,
    };

    // 🔥 instant UI
    setMessages((prev) => [...prev, newMsg]);

    try {
      await apiFetch("/api/chat/send", token, {
        method: "POST",
        body: {
          receiver: selectedUser._id,
          message: text,
        },
      });

      // 🔥 reload after send
      loadMessages(selectedUser._id);

    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    setText("");
  };

  const isEmployeeDashboard = user?.role === "employee" || user?.role === "user";
  const content = (
   <div className="flex h-[calc(100vh-80px)] rounded-xl overflow-hidden bg-[#0b1220] border border-gray-800">

      {/* ================= ADMIN SIDEBAR ================= */}
      {user?.role === "company_admin" && (
        <div className="w-1/4 overflow-y-auto border-r border-gray-800 bg-[#0f172a]">
          <div className="p-3 text-gray-400 text-xs">EMPLOYEES</div>

          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedUser(u);
                setMessages([]);
                loadMessages(u._id);
              }}
              className={`px-4 py-3 cursor-pointer ${
                selectedUser?._id === u._id
                  ? "bg-blue-600/20 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {u.name}
            </div>
          ))}
        </div>
      )}

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 text-white bg-[#0f172a]">
          {selectedUser?.name || "Admin"}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              No messages yet
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === user?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-xs ${
                  m.sender === user?.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {m.message}
              </div>
            </div>
          ))}

          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        {(selectedUser || user?.role === "employee" || user?.role === "user") && (
          <div className="p-3 border-t border-gray-800 flex gap-2 bg-[#0f172a]">
            <input
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded"
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