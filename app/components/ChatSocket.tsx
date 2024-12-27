import React from 'react'
import { useEffect, useState } from "react"; 
import { useGlobalContext } from "./GlobalContext";


const ChatSocket = () => {
interface Message {
    sender_id: number; 
    recipient_id: number; 
    content: string;
}
const [messages, setMessages] = useState<Message[]>([]);
const [content, setContent] = useState<string>("");
const { socket } = useGlobalContext(); const userID = 1; // Example: Set this dynamically based on your authentication logic const recipientID = 2; // Example: Set this dynamically based on your recipient selection

useEffect(() => { if (socket) 
    { socket.onmessage = (event) =>{ 
        const msg: Message = JSON.parse(event.data); setMessages((prev) => [...prev, msg]); 
    };
  socket.onerror = (error) => { 
    console.error("WebSocket error:", error); 
}; 
  socket.onclose = () => { 
    console.log("WebSocket connection closed"); 
}; return () => { 
    socket.close(); 
}; } else { 
    console.log("Socket Not Present!"); 
} 
}, [socket]);



return (
    <div>
      
    </div>
  )
}

export default ChatSocket
