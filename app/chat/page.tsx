'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from "../components/nav";
import Chatpic from '../components/chatpic';
import { Loading } from '../components/loading';
import { useGlobalContext } from '../components/GlobalContext';

const ChatContent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const chaturl = `${serverUrl}/chatusers`;
  const searchParams = useSearchParams();
  const { socket, subscribe } = useGlobalContext();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(chaturl, {
          method: "GET",
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError("Server error: " + err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeSetting);
  }, [chaturl]);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setSelectedUserId(userId);
      fetchMessages(userId);
      removechatnot(userId);
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.sender_id === parseInt(selectedUserId) || data.receiver_id === parseInt(selectedUserId)) {
        setMessages(prevMessages => [...prevMessages, data]);
        removechatnot(selectedUserId);
      }
    });

    return () => unsubscribe();
  }, [selectedUserId, subscribe]);

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`${serverUrl}/messages?userid=${userId}`, {
        method: "POST",
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Server error: " + err);
    }
  };

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
    window.history.pushState({}, '', `/chat?userId=${userId}`);
    fetchMessages(userId);
  };

  const sendMessage = () => {
    if (!selectedUserId || !messageInput.trim()) return;

    const message = {
      receiver_id: parseInt(selectedUserId),
      content: messageInput.trim()
    };

    socket?.send(JSON.stringify(message));
    setMessageInput('');
  };

  const removechatnot = async (senderid) => {
    try {
      const response = await fetch(`${serverUrl}/mnchat`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          sender_id: senderid,
        }),
      });

      if (!response.ok) {
        console.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div>
        <Nav isDarkMode={isDarkMode} />
      </div>

      <div className={`flex w-full h-screen ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className={`w-[30%] p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="chatlist">
            <div className={`card shadow-md mb-4 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-base-200 text-gray-900'}`}>
              <div className="card-body p-4">
                <h2 className="card-title text-lg font-bold">Users</h2>
              </div>
            </div>

            <ul className={`menu menu-md rounded-box w-full h-200 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-base-200 text-gray-900'}`}>
              {Array.isArray(users) && users.length > 0 ? (
                users.map(user => (
                  <li key={user.user_id} onClick={() => handleUserClick(user.user_id)}>
                    <a className="flex items-center cursor-pointer">
                      <Chatpic image={`${serverUrl}/uploads/${user.image}`} /> {user.nickname || user.first_name}
                    </a>
                  </li>
                ))
              ) : (
                <li>No users available for chat.</li>
              )}
            </ul>
          </div>
        </div>

        <div className={`w-[70%] p-4 flex flex-col h-full ${isDarkMode ? 'bg-gray-800' : 'bg-base-200'}`}>
          <div className={`card mb-4 border-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-base-200 border-gray-300 text-gray-900'}`}>
            <div className="card-body p-2">
              <h2 className="card-title text-lg font-bold">Chat</h2>
            </div>
          </div>

          <div className={`flex-1 overflow-auto border rounded-lg p-4 h-[400px] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {selectedUserId ? (messages.length > 0 ? (
              messages.map(message => (
                <div key={message.message_id} className={`chat ${message.sender_id === parseInt(selectedUserId) ? 'chat-start' : 'chat-end'}`}>
                  <div className={`chat-bubble ${isDarkMode ? 'bg-gray-700 text-white' : ''}`}>
                    <div>{message.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat chat-start">
                <div className={`chat-bubble ${isDarkMode ? 'bg-gray-700 text-white' : ''}`}>
                  No messages yet. Start chatting!
                </div>
              </div>
            )) : (
              <div className="chat chat-start">
                <div className={`chat-bubble ${isDarkMode ? 'bg-gray-700 text-white' : ''}`}>
                  😊 Pick a user to start chatting!
                </div>
              </div>
            )}
          </div>

          {selectedUserId && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-200'}`}>
              <div className="flex items-center space-x-4">
                <button className={`btn ${isDarkMode ? 'btn-light' : 'btn-outline'}`} onClick={sendMessage}>Send</button>
                <input
                  type="text"
                  className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-900'}`}
                  placeholder="Type something..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ChatContent />
    </Suspense>
  );
};

export default Page;
