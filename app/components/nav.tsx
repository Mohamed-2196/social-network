"use client";
<<<<<<< HEAD

=======
>>>>>>> c304d438b60ff69e6f563b02330232043028e258
import { FaBell, FaComments, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav({ isDarkMode }) {
  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch(`${serverUrl}/notificationnum`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.count); // Assuming the API returns { count: number }
        } else {
          console.error('Failed to fetch notification count');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchNotificationCount();
  }, [serverUrl]);

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
<<<<<<< HEAD
    router.push('/'); // Navigate to home page
  };

  const handleNotificationClick = () => {
    router.push('/notifications'); // Navigate to notifications page
=======
    router.push('/'); // Navigate to the home page
>>>>>>> c304d438b60ff69e6f563b02330232043028e258
  };

  return (
    <nav
      className={`navbar shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-base-100 text-gray-900'
      }`}
    >
      <div className="flex-1">
<<<<<<< HEAD
        <button className="btn btn-ghost normal-case text-xl" onClick={handleHome}>
=======
        <button
          className="btn btn-ghost normal-case text-xl"
          onClick={handleHome}
        >
>>>>>>> c304d438b60ff69e6f563b02330232043028e258
          SocialApp
        </button>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search users"
            className={`input input-bordered w-24 md:w-auto ${
              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'
            }`}
          />
        </div>
        <div className="relative group">
<<<<<<< HEAD
          <button 
            className="btn btn-ghost btn-circle" 
=======
          <button
            className="btn btn-ghost btn-circle"
>>>>>>> c304d438b60ff69e6f563b02330232043028e258
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
