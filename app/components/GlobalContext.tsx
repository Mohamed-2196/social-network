'use client'
import React, { createContext, useContext, ReactNode, useState } from "react";

// Define the shape of the global variable
interface GlobalContextType {
  socket: WebSocket | null; // Allow null
  setSocket: (value: WebSocket | null) => void; // Allow setting null
}

// Create the context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Create a provider component
export const GlobalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null); // State allows null

  return (
    <GlobalContext.Provider value={{ socket, setSocket }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the context
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
