"use client";

import React, { useEffect, useState } from "react";
import { useGlobalContext } from "./GlobalContext";

interface Message {
  username: string;
  content: string;
}

const WebSocketComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>("User1");
  const [content, setContent] = useState<string>("");
  const { socket } = useGlobalContext();

  const serverUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/test`;

  useEffect(() => {
    if (socket) {
      socket.onopen = () => {
        console.log("Connected to WebSocket server");
      };

      socket.onmessage = (event) => {
        const msg: Message = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
      return () => {
        socket.close();
      };
    } else {
      console.log("Socket Not Present!");
    }
  }, [socket]);

  const sendMessage = async () => {
    if (content.trim()) {
      const message: Message = { username, content };

      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          // headers: { "Content-Type": "application/json" }, WHY DOES THIS SHIT BREAK THE CODE????
          body: JSON.stringify(message),
          credentials: "include",
        });

        if (!response.ok) {
          console.error("Failed to send message");
        }

        setContent(""); // Clear the input field
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Type a message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.username}:</strong> {msg.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
