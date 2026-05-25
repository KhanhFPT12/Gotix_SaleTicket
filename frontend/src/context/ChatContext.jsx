import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { apiGet, apiPatch } from "../api/client";
import { connectSocket, disconnectSocket, getSocket } from "../services/socketService";

const ChatContext = createContext(null);

function getSenderId(msg) {
  return msg?.senderId?._id?.toString() ?? msg?.senderId?.toString?.() ?? msg?.senderId ?? '';
}

function normalizeConv(conv, currentUserId) {
  const { lastMessage, unreadCount, _id } = conv;
  const senderId = getSenderId(lastMessage);
  const isLastMine = senderId === currentUserId;
  const otherUser = isLastMine ? lastMessage.receiverId : lastMessage.senderId;
  const tid =
    _id?.ticketId?._id?.toString() ??
    _id?.ticketId?.toString?.() ??
    _id?.ticketId ??
    null;
  return {
    key: `${otherUser?._id ?? otherUser}_${tid ?? 'null'}`,
    otherUser: {
      _id: otherUser?._id?.toString() ?? otherUser?.toString?.() ?? '',
      name: otherUser?.name ?? 'Unknown',
      avatar: otherUser?.avatar ?? null,
    },
    ticketId: tid,
    ticketTitle: lastMessage?.ticketId?.title ?? null,
    lastMessage: lastMessage?.message ?? '',
    lastMessageAt: lastMessage?.createdAt ?? null,
    unreadCount: unreadCount ?? 0,
    isLastMine,
  };
}

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConvState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Ref so socket handlers always see latest activeConv
  const activeConvRef = useRef(null);

  // Stable setter that keeps ref in sync
  const setActiveConv = useCallback((conv) => {
    activeConvRef.current = conv;
    setActiveConvState(conv);
  }, []);

  // ── Refresh unread count from server ───────────────────────────────────────
  const refreshUnread = useCallback(() => {
    apiGet('/chats/unread-count').then((res) => {
      if (res.success) setUnreadTotal(res.data.count ?? 0);
    }).catch(() => {});
  }, []);

  // ── Load conversations list ─────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    const uid = currentUser._id?.toString() ?? currentUser.id ?? '';
    const res = await apiGet('/chats/conversations');
    if (res.success) {
      setConversations((res.data.conversations || []).map((c) => normalizeConv(c, uid)));
    }
  }, [currentUser]);

  // ── Open a conversation (stable — no conversations dep) ────────────────────
  const openConversation = useCallback(
    async (otherUserId, ticketId, otherUserInfo, ticketInfo) => {
      const conv = {
        key: `${otherUserId}_${ticketId ?? 'null'}`,
        otherUser: otherUserInfo ?? { _id: otherUserId, name: 'User', avatar: null },
        ticketId: ticketId ?? null,
        ticketTitle: ticketInfo?.title ?? null,
      };

      // Update ref and state immediately so UI shows the chat window
      activeConvRef.current = conv;
      setActiveConvState(conv);
      setMessages([]);
      setLoadingMessages(true);
      setTypingUsers(new Set());

      // Load message history
      try {
        const tidParam = ticketId || 'null';
        const res = await apiGet(`/chats/${tidParam}/${otherUserId}`);
        if (res.success) setMessages(res.data.messages || []);
      } catch {
        // ignore — messages list stays empty
      } finally {
        setLoadingMessages(false);
      }

      // Mark as read
      const tidParam = ticketId || 'null';
      apiPatch(`/chats/read/${tidParam}/${otherUserId}`, {}).catch(() => {});
      getSocket()?.emit('mark_read', { senderId: otherUserId, ticketId: ticketId ?? null });

      // Reset unread for this conv in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser._id === otherUserId && (c.ticketId ?? null) === (ticketId ?? null)
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
      refreshUnread();
    },
    [refreshUnread] // stable: refreshUnread is stable, all setters are stable
  );

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      disconnectSocket();
      setConversations([]);
      setMessages([]);
      setUnreadTotal(0);
      setTypingUsers(new Set());
      setOnlineUsers(new Set());
      setActiveConv(null);
      return;
    }

    const socket = connectSocket();

    function onReceiveMessage(msg) {
      const senderIdStr = getSenderId(msg);
      const conv = activeConvRef.current;
      const msgTicketId =
        msg.ticketId?._id?.toString() ?? msg.ticketId?.toString?.() ?? msg.ticketId ?? null;
      const isActiveConv =
        conv &&
        conv.otherUser._id === senderIdStr &&
        (conv.ticketId ?? null) === msgTicketId;

      if (isActiveConv) {
        setMessages((prev) => [...prev, msg]);
        // Auto mark as read
        getSocket()?.emit('mark_read', {
          senderId: senderIdStr,
          ticketId: conv.ticketId ?? null,
        });
      } else {
        setUnreadTotal((n) => n + 1);
        // Update sidebar unread count
        setConversations((prev) => {
          const key = `${senderIdStr}_${msgTicketId ?? 'null'}`;
          const exists = prev.find((c) => c.key === key);
          if (exists) {
            return prev.map((c) =>
              c.key === key
                ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt, unreadCount: c.unreadCount + 1 }
                : c
            );
          }
          // New conversation — reload full list
          loadConversations();
          return prev;
        });
      }
    }

    function onMessagesRead({ senderId }) {
      const currentId = currentUser._id?.toString() ?? currentUser.id ?? '';
      if (senderId === currentId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    }

    function onTyping({ senderId }) {
      setTypingUsers((prev) => new Set([...prev, senderId]));
    }

    function onStopTyping({ senderId }) {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    }

    function onUserOnline({ userId }) {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    }

    function onUserOffline({ userId }) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on('receive_message', onReceiveMessage);
    socket.on('messages_read', onMessagesRead);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    loadConversations();
    refreshUnread();

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('messages_read', onMessagesRead);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
    };
  }, [currentUser, loadConversations, refreshUnread, setActiveConv]);

  // ── Send message via socket ─────────────────────────────────────────────────
  const sendMessage = useCallback((receiverId, ticketId, message) => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket?.connected) return reject(new Error('Mất kết nối. Vui lòng thử lại.'));

      socket.emit('send_message', { receiverId, ticketId: ticketId || null, message }, (res) => {
        if (res?.error) return reject(new Error(res.error));
        const msg = res?.message;
        if (msg) {
          setMessages((prev) => [...prev, msg]);
          setConversations((prev) =>
            prev.map((c) =>
              c.otherUser._id === receiverId && (c.ticketId ?? null) === (ticketId ?? null)
                ? { ...c, lastMessage: message, lastMessageAt: msg.createdAt, isLastMine: true }
                : c
            )
          );
        }
        resolve(msg);
      });
    });
  }, []);

  const emitTyping = useCallback((receiverId) => {
    getSocket()?.emit('typing', { receiverId });
  }, []);

  const emitStopTyping = useCallback((receiverId) => {
    getSocket()?.emit('stop_typing', { receiverId });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConv,
        messages,
        unreadTotal,
        typingUsers,
        loadingMessages,
        onlineUsers,
        openConversation,
        sendMessage,
        loadConversations,
        emitTyping,
        emitStopTyping,
        setActiveConv,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
