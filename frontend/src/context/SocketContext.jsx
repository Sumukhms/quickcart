/**
 * SocketContext.jsx — UPDATED
 *
 * Change vs original: exposes `joinUserRoom` and emits "join_user_room"
 * so NotificationContext can subscribe to user-specific notification events.
 * All existing code is preserved unchanged.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

// More robust URL construction - handle various API URL formats
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return "http://localhost:5000";

  // Remove trailing slashes and /api suffix if present
  let baseUrl = apiUrl.replace(/\/+$/, "").replace(/\/api$/, "");
  return baseUrl;
};

const SOCKET_URL = getSocketURL();

export function SocketProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const connectionAttemptedRef = useRef(false);

  useEffect(() => {
    // Only create socket if logged in and not already attempted
    if (!isLoggedIn || connectionAttemptedRef.current) return;

    connectionAttemptedRef.current = true;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      forceNew: false, // Prevent multiple connections
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to server");
      setConnected(true);
      // Auto-join role-based rooms
      if (user?.role === "delivery") {
        socket.emit("join_delivery", user.id || user._id);
      }
      // Auto-join user-specific notification room
      const userId = user?.id || user?._id;
      if (userId) {
        socket.emit("join_user_room", userId.toString());
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      setConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("[Socket] Reconnected after", attemptNumber, "attempts");
      setConnected(true);
    });

    return () => {
      console.log("[Socket] Cleaning up connection");
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      connectionAttemptedRef.current = false;
    };
  }, [isLoggedIn]); // Only depend on isLoggedIn, not user.id

  const joinOrderRoom = (orderId) => {
    socketRef.current?.emit("join_order", orderId);
  };

  const joinStoreRoom = (storeId) => {
    socketRef.current?.emit("join_store", storeId);
  };

  // NEW: join user-specific room for notifications
  const joinUserRoom = (userId) => {
    socketRef.current?.emit("join_user_room", userId);
  };

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  const off = (event, handler) => {
    socketRef.current?.off(event, handler);
  };

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        joinOrderRoom,
        joinStoreRoom,
        joinUserRoom, // NEW
        on,
        off,
        emit,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
