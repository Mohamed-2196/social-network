"use client";

import { FaBell, FaComments, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGlobalContext } from './GlobalContext';
export default function Nav({ isDarkMode }) {
  const { subscribe } = useGlobalContext();

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      if (data.type === "notificationCount") {
        setNotificationCount(data.count);
        const sound = new Audio("not.mp3");
        sound.play();
      }
    });

    return () => unsubscribe();
  }, [subscribe]);
  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const [notificationCount, setNotificationCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]); // Store user data
  
  useEffect(() => {
    const fetchNotificationCountAndUsers = async () => {
      try {
        const response = await fetch(`${serverUrl}/notificationnum`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.count); // Assuming the API returns { count: number }
          setUsers(data.users); // Assuming the API returns { users: Array }
        } else {
          console.error('Failed to fetch notification count and users');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchNotificationCountAndUsers();
  }, [serverUrl]);

  useEffect(() => {
    // Filter users based on the search term
    if (searchTerm.trim() === '') {
      setFilteredUsers([]);
    } else {
      const results = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results);
    }
  }, [searchTerm, users]);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${serverUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/auth'); // Redirect to the auth page
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileNavigation = () => {
    router.push('/profile'); // Navigate to the profile page
  };

  const handleHome = () => {
    router.push('/'); // Navigate to home page
  };

  const handleNotificationClick = () => {
    router.push('/notifications'); // Navigate to notifications page
  };

  const handleUserClick = (userId) => {
    router.push(`/profilepage/${userId}`); // Navigate to the selected user's profile page
    setFilteredUsers([]); // Clear search results on navigation
    setSearchTerm(''); // Clear search input
  };

  return (
    <nav
      className={`navbar shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-base-100 text-gray-900'
      }`}
    >
      <div className="flex-1">
        <button
          className="btn btn-ghost normal-case text-xl"
          onClick={handleHome}
        >
          SocialApp
        </button>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control relative">
          <input
            type="text"
            placeholder="Search users"
            className={`input input-bordered w-24 md:w-auto ${
              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredUsers.length > 0 && (
            <div className={`absolute mt-1 w-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border rounded-md shadow-lg z-20`}>
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  className="block px-4 py-2 hover:bg-indigo-100 w-full text-left flex items-center"
                  onClick={() => handleUserClick(user.id)}
                >
                  <img src={serverUrl+ "/uploads/"+user.avatar} alt={`${user.first_name} ${user.last_name}`} className="w-8 h-8 rounded-full mr-2" />
                  <span>{user.first_name} {user.last_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative group">
          <button
            className="btn btn-ghost btn-circle"
            onClick={handleProfileNavigation}
          >
            <FaUser />
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 ${
              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'
            } border rounded-md shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          >
            <button
              className="block px-4 py-2 hover:bg-indigo-100 w-full text-left"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <button className="btn btn-ghost btn-circle" onClick={handleNotificationClick}>
          <div className="indicator">
            <FaBell />
            {notificationCount > 0 && (
              <span className="badge badge-xs badge-primary indicator-item">{notificationCount}</span>
            )}
          </div>
        </button>
        <button className="btn btn-ghost btn-circle">
          <FaComments />
        </button>
      </div>
    </nav>
  );
}