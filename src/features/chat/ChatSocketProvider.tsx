import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/storage";

import { connectChatSocket, disconnectChatSocket, getChatSocket } from "./socket";

type ChatSocketContextValue = {
  /** True while the socket has a live connection. */
  connected: boolean;
};

const ChatSocketContext = createContext<ChatSocketContextValue>({ connected: false });

/**
 * Owns the chat socket lifecycle: connects once a user is signed in, tears down
 * on logout, and drops/reopens the connection as the app backgrounds and
 * foregrounds. Renders children unchanged (state is exposed via context).
 * The socket never connects without a token.
 */
export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  // Connect/disconnect with the auth session.
  useEffect(() => {
    if (!user) {
      disconnectChatSocket();
      setConnected(false);
      return;
    }

    let cancelled = false;
    let detach: (() => void) | undefined;

    (async () => {
      const token = await getAccessToken();
      if (cancelled || !token) return;

      const socket = connectChatSocket(token);
      const onConnect = () => setConnected(true);
      const onDisconnect = () => setConnected(false);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      setConnected(socket.connected);
      detach = () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
      };
    })();

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [user]);

  // Battery-friendly: drop the connection in the background, reopen on return.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      const socket = getChatSocket();
      if (!socket) return;
      if (state === "active") {
        if (!socket.connected) socket.connect();
      } else {
        socket.disconnect();
      }
    });
    return () => sub.remove();
  }, []);

  // Final teardown when the whole tree unmounts.
  useEffect(() => () => disconnectChatSocket(), []);

  return <ChatSocketContext.Provider value={{ connected }}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket(): ChatSocketContextValue {
  return useContext(ChatSocketContext);
}

// Typing cadence.
const TYPING_START_THROTTLE_MS = 2_000; // re-announce "typing" at most this often
const TYPING_IDLE_STOP_MS = 3_000; // silence for this long → send typing:stop
const PARTNER_TYPING_TIMEOUT_MS = 4_000; // auto-clear partner indicator if stop is missed

/**
 * Subscribes the open thread to realtime: joins the conversation room (which is
 * what lets `message:new` reach this client) and manages typing both ways.
 *
 * Returns `isPartnerTyping` (the other participant) and `notifyTyping()` to call
 * on each keystroke; a trailing `typing:stop` is emitted automatically. Also
 * re-joins the room on reconnect and leaves it on unmount.
 */
export function useTypingIndicator(conversationId: string) {
  const { connected } = useChatSocket();
  const { user } = useAuth();
  const myId = user?.userId;

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const lastStartRef = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    getChatSocket()?.emit("typing:stop", conversationId);
  }, [conversationId]);

  const notifyTyping = useCallback(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const now = Date.now();
    if (!isTypingRef.current || now - lastStartRef.current > TYPING_START_THROTTLE_MS) {
      isTypingRef.current = true;
      lastStartRef.current = now;
      socket.emit("typing:start", conversationId);
    }

    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_STOP_MS);
  }, [conversationId, stopTyping]);

  // Join the room (on mount + every reconnect) and listen for the partner's typing.
  useEffect(() => {
    if (!conversationId) return;
    const socket = getChatSocket();
    if (!socket) return;

    const join = () => socket.emit("conversation:join", conversationId);
    join();
    socket.on("connect", join);

    const onStart = (p: { conversationId: string; userId: string }) => {
      if (p.conversationId !== conversationId || p.userId === myId) return;
      setIsPartnerTyping(true);
      if (partnerTimer.current) clearTimeout(partnerTimer.current);
      partnerTimer.current = setTimeout(() => setIsPartnerTyping(false), PARTNER_TYPING_TIMEOUT_MS);
    };
    const onStop = (p: { conversationId: string; userId: string }) => {
      if (p.conversationId !== conversationId || p.userId === myId) return;
      setIsPartnerTyping(false);
      if (partnerTimer.current) clearTimeout(partnerTimer.current);
    };

    socket.on("typing:start", onStart);
    socket.on("typing:stop", onStop);

    return () => {
      stopTyping();
      socket.emit("conversation:leave", conversationId);
      socket.off("connect", join);
      socket.off("typing:start", onStart);
      socket.off("typing:stop", onStop);
      if (partnerTimer.current) clearTimeout(partnerTimer.current);
      setIsPartnerTyping(false);
    };
    // `connected` is a dependency so we re-run (and re-join/re-bind) across a
    // full reconnect where a new socket instance may be in play.
  }, [conversationId, myId, connected, stopTyping]);

  return { isPartnerTyping, notifyTyping, stopTyping };
}
