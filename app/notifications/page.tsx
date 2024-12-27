"use client";

import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import Nav from '../components/nav';
import { Loading } from '../components/loading';
import { Bug } from '../components/error';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '../components/GlobalContext';

export default function NotificationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/notifications";
  const router = useRouter(); // Initialize useRouter
  const { subscribe } = useGlobalContext();

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type === "notifications") {
        console.log(data.notifications);
        setNotifications(data.notifications);
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const handleProfileNavigation = (senderId) => {
    router.push(`/profilepage/${senderId}`); // Navigate to the sender's profile page
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: 'POST',
          credentials: 'include', // Include cookies for session management
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        setNotifications(data); // Assuming your API returns { notifications: [...] }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handle = async (notificationId, action) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SERVER_URL + '/managenotifications', {
        method: 'POST',
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          action: action, // Pass the action (accept or reject)
          id: notificationId, // Pass the notification ID
        }),
      });
  
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } else {
        console.error('Failed to accept/reject notification');
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  };

  const handleAccept = (notificationId) => handle(notificationId, 'accept');
  const handleReject = (notificationId) => handle(notificationId, 'reject');

  if (loading) return <Loading />;
  if (error) return <Bug message={error.message} />;

  return (
    <>
      <Nav />
      <br />
      <div className="max-w-5xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Notifications</h1>
  
            <div className="flex mb-6 border-b border-gray-200">
              <button
                className={`w-1/2 pb-2 font-semibold ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                onClick={() => setActiveTab('all')}
              >
                All Notifications
              </button>
              <button
                className={`w-1/2 pb-2 font-semibold ${activeTab === 'messages' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages
              </button>
            </div>
  
            <div className="space-y-4">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
                    onClick={() => notification.type === 'followRequest' && handleProfileNavigation(notification.sender_id)} // Navigate on click
                  >
                    {notification.type === 'followRequest' && <FaUserPlus className="text-blue-500 mr-4 text-xl" />}
                    {notification.type === 'groupInvitation' && <FaUsers className="text-green-500 mr-4 text-xl" />}
                    {notification.type === 'groupJoinRequest' && <FaUserPlus className="text-yellow-500 mr-4 text-xl" />}
                    {notification.type === 'groupEvent' && <FaCalendarAlt className="text-purple-500 mr-4 text-xl" />}
  
                    <div className="flex-grow">
                      <p className="text-gray-800 font-medium">{notification.content}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true,
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
  
                    {(notification.type === 'followRequest' || notification.type === 'groupInvitation' || notification.type === 'groupJoinRequest') && (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAccept(notification.id); }} // Prevent click from bubbling up
                          className="text-green-500 hover:bg-green-100 p-2 rounded-full"
                        >
                          <FaCheck />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReject(notification.id); }} // Prevent click from bubbling up
                          className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 font-medium">No notifications for you 😊</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}