import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../api/client";

interface DoctorProfile {
  id: number;
  full_name: string;
  email: string;
}

interface ChatMessage {
  id?: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read?: boolean;
  created_at: string;
}

export function useDoctorChat(userId: number | undefined) {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [doctorChatInput, setDoctorChatInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isChatOpenRef = useRef(isChatOpen);

  // Keep ref in sync with state
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const connectWebSocket = useCallback(
    (clinicianId: number) => {
      if (socketRef.current) {
        socketRef.current.close();
      }

      const token = localStorage.getItem("token");
      if (!token) return;

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//127.0.0.1:8000/api/chat/direct/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log("Connected to doctor chat WS");

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (
          (msg.sender_id === clinicianId && msg.receiver_id === userId) ||
          (msg.sender_id === userId && msg.receiver_id === clinicianId)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (isChatOpenRef.current) {
            if (msg.sender_id === clinicianId) {
              apiFetch(`/api/chat/direct/read/${clinicianId}`, {
                method: "PATCH",
              });
            }
          } else {
            if (msg.sender_id === clinicianId) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      };

      ws.onclose = () => console.log("Disconnected from doctor chat WS");
      ws.onerror = (err) => console.error("Doctor chat WS error:", err);

      socketRef.current = ws;
    },
    [userId],
  );

  const fetchDoctorProfile = useCallback(async () => {
    try {
      const doc = await apiFetch<DoctorProfile>("/api/patients/clinician");
      if (doc) {
        setDoctorProfile(doc);
        const unreadData = await apiFetch<Record<number, number>>(
          "/api/chat/direct/unread",
        );
        if (unreadData) {
          setUnreadCount(unreadData[doc.id] || 0);
        }
        connectWebSocket(doc.id);
      }
    } catch (err) {
      console.log("No assigned clinician or error loading profile:", err);
    }
  }, [connectWebSocket]);

  const fetchChatHistory = useCallback(async (clinicianId: number) => {
    setIsLoading(true);
    try {
      const history = await apiFetch<ChatMessage[]>(
        `/api/chat/direct/history/${clinicianId}`,
      );
      if (history) setMessages(history);
      await apiFetch(`/api/chat/direct/read/${clinicianId}`, {
        method: "PATCH",
      });
      setUnreadCount(0);
    } catch (err) {
      console.error("Error fetching doctor chat history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !doctorProfile || !socketRef.current) return false;

      const payload = {
        receiver_id: doctorProfile.id,
        message: text.trim(),
      };

      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(payload));
        setDoctorChatInput("");
        return true;
      }
      return false;
    },
    [doctorProfile],
  );

  useEffect(() => {
    if (userId) {
      fetchDoctorProfile();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [userId, fetchDoctorProfile]);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  return {
    doctorProfile,
    messages,
    isLoading,
    isChatOpen,
    unreadCount,
    doctorChatInput,
    setDoctorChatInput,
    socketRef,
    messagesEndRef,
    setIsChatOpen,
    fetchChatHistory,
    sendMessage,
  };
}
