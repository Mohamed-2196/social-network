"use client";
import React, { useEffect, useState } from "react";
import { useGlobalContext } from "./GlobalContext";
interface WebSocketMessage {
  id: number;
  text: string;
}
const Websocket = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [input, setInput] = useState<string>("");
  // const [socket, setSocket] = useState<WebSocket | null>(null);
  const { socket, setSocket } = useGlobalContext();

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event: MessageEvent) => {
      console.log("Message received:", event.data);

      // Parse incoming messages as strings
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, text: event.data },
      ]);
    };

    ws.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Store the WebSocket instance
    setSocket(ws);

    // Cleanup when the component unmounts
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(input);
      setInput("");
    } else {
      console.error("WebSocket is not open");
    }
  };
  return <div></div>;
};

export default Websocket;
