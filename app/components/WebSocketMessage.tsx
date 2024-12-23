"use client";

import React, { useEffect, useState } from "react";
import { useGlobalContext } from "./GlobalContext";

interface WebSocketMessage {
  id: number;
  text: string;
}

const WebSocketComponent: React.FC = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const { socket } = useGlobalContext();

  useEffect(() => {
    if (socket) {
      socket.onopen = () => {
        console.log("Connected to WebSocket server temp");
      };

      socket.onmessage = (event: MessageEvent) => {
        console.log("Message received:", event.data);
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: prevMessages.length + 1, text: event.data },
        ]);
      };

      socket.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
      }
    };
  }, [socket]);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(input);
      setInput("");
    } else {
      console.error("WebSocket is not open");
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>{msg.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
