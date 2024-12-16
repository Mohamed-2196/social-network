"use client";

import React, { useEffect, useState } from "react";

interface WebSocketMessage {
  id: number;
  text: string;
}

const WebSocketComponent: React.FC = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket("ws://localhost:8080/group");

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
