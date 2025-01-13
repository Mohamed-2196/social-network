"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

interface GlobalContextType {
  socket: WebSocket | null;
  setSocket: (value: WebSocket | null) => void;
  subscribe: (callback: (data: any) => void) => () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const subscribers = useRef<((data: any) => void)[]>([]);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const subscribe = (callback: (data: any) => void) => {
    subscribers.current.push(callback);
    return () => {
      subscribers.current = subscribers.current.filter(cb => cb !== callback);
    };
  };

  const connectWebSocket = () => {
    if (isConnected) return; // Prevent multiple connections

    const ws = new WebSocket("ws://localhost:8080/ws");
    setSocket(ws);

    ws.onopen = () => {
      console.log("Connected to WebSocket server from global context");
      setIsConnected(true);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null; // Clear the interval once connected
      }
    };

    ws.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false); // Update connection state
      if (reconnectIntervalRef.current === null) {
        reconnectIntervalRef.current = setInterval(connectWebSocket, 3000);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      subscribers.current.forEach(callback => callback(data));
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return (
    <GlobalContext.Provider value={{ socket, setSocket, subscribe }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};