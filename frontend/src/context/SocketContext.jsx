import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Auto-join role-based rooms
      if (user?.role === "delivery") {
        socket.emit("join_delivery", user.id || user._id);
      }
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isLoggedIn, user?.id]);

  const joinOrderRoom = (orderId) => {
    socketRef.current?.emit("join_order", orderId);
  };

  const joinStoreRoom = (storeId) => {
    socketRef.current?.emit("join_store", storeId);
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
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinOrderRoom, joinStoreRoom, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);