import React from "react";
import WebSocketComponent from "../components/WebSocketMessage";

const Home: React.FC = () => {
  return (
    <div>
      <h1>Next.js WebSocket Example with TypeScript</h1>
      <WebSocketComponent />
    </div>
  );
};

export default Home;
