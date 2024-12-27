"use client";

import { FaBell, FaComments, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useGlobalContext } from './GlobalContext';
import { gsap } from 'gsap';

export default function Nav({ isDarkMode }) {
  const { subscribe } = useGlobalContext();
  const flowerRef = useRef(null); // Reference to the flower for animation

  const [notificationCount, setNotificationCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]); // Store user data
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Manage profile menu visibility

  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

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

  useEffect(() => {
    // GSAP animation for rotating the flower in place (no longer around letters)
    gsap.to(flowerRef.current, {
      rotate: 360,
      duration: 3,
      repeat: -1, // Infinite repeat
      ease: "linear",
    });
  }, []);

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
        router.push('/auth');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileNavigation = () => {
    router.push('/profile');
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  const handleUserClick = (userId) => {
    router.push(`/profilepage/${userId}`);
    setFilteredUsers([]);
    setSearchTerm('');
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen); // Toggle profile menu visibility
  };

  return (
    <nav
      className={`navbar shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-base-100 text-gray-900'
      }`}
    >
      <div className="flex-1">
        <button className="btn btn-ghost normal-case text-xl" onClick={handleHome}>
          S
          <span
            ref={flowerRef} // Reference for the rotating flower
            className="inline-block mx-1"
            style={{
              display: 'inline-block',
              width: '2em', 
              height: '2em',
              transformOrigin: 'center center',
              marginLeft: '-0.70em',
              marginRight: '-0.70em',
            }}
          >
            {/* flower SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 400" fill="none">
  <path opacity="0.503384" d="M194.561 172.066C194.39 165.274 191.224 159.06 190.272 152.428C187.778 135.048 192.416 79 222.867 79C254.454 79 222.191 153.804 214.289 168.224C213.54 169.59 207.105 178.256 207.856 179.751C208.171 180.378 210.766 176.442 210.858 176.335C213.943 172.753 217.663 169.273 221.151 166.089C230.669 157.404 290.522 104.164 304.173 138.828C309.447 152.221 295.309 166.055 285.053 173.346C274.369 180.944 260.012 182.81 248.17 187.862C243.33 189.927 238.546 191.34 233.589 192.984C232.205 193.444 229.299 192.387 229.299 193.838C229.299 194.068 235.556 191.642 242.166 189.996C252.831 187.342 294.948 188.367 309.029 199.539C323.11 210.711 323.11 220.567 314.115 227.815C292.968 244.852 269.869 230.996 249.456 222.869C244.404 220.856 238.952 220.628 234.018 218.172C233.695 218.012 227.584 214.89 227.584 216.038C227.584 216.866 240.093 217.911 246.884 222.869C266.359 237.084 292.99 293.533 271.33 306.97C248.201 321.317 215.721 259.162 213.432 252.325C212.241 248.769 212.86 245.213 212.144 241.652C211.825 240.061 210.858 235.334 210.858 236.956C210.858 258.26 215.82 296.531 200.993 312.519C191.65 322.594 174.602 324.561 169.686 308.25C165.09 293.002 167.371 268.629 173.546 254.032C175.734 248.859 185.593 236.645 185.126 235.249C184.51 233.41 180.535 239.355 180.407 239.518C175.881 245.312 170.736 251.147 164.968 255.74C160.052 259.655 153.949 261.815 148.67 265.132C135.158 273.627 112.486 288.638 99.3499 269.401C87.6893 252.325 132.478 218.151 153.818 213.903C159.742 212.724 167.013 210.473 173.117 211.342C174.953 211.603 174.028 211.554 174.832 212.622C179.251 218.486 149.21 216.764 146.955 216.465C126.118 213.699 78.2339 218.479 80.0503 189.569C82.0596 157.587 140.921 177.18 148.67 179.751C161.297 183.94 171.873 191.59 163.681 186.154C150.126 177.157 90.4948 126.565 123.69 100.059C146.918 81.5127 192.416 164.979 192.416 175.482" stroke="#000000" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M184.112 189.912C192.6 176.657 209.525 178.684 221.315 185.651C240.625 197.063 220.283 235.269 191.033 231.669C164.743 228.432 168.065 185.664 194.061 177.13" stroke="#000000" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

          </span>
          cialApp
        </button>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control relative">
          <input
            type="text"
            placeholder="Search users"
            className={`input input-bordered w-24 md:w-auto ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'}`}
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
                  <img
                    src={serverUrl + "/uploads/" + user.avatar}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>{user.first_name} {user.last_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-none gap-2">
        <button onClick={handleNotificationClick} className="btn btn-ghost btn-circle">
          <div className="indicator">
            <FaBell />
            {notificationCount > 0 && (
              <span className="badge badge-xs badge-warning indicator-item">{notificationCount}</span>
            )}
          </div>
        </button>
        <div className="relative group">
          <button
            onClick={toggleProfileMenu}
            className="btn btn-ghost btn-circle"
          >
            <FaUser />
          </button>
          {isProfileMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 ${
                isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'
              } border rounded-md shadow-lg z-20`}
            >
              <button
                className="block px-4 py-2 hover:bg-indigo-100 w-full text-left"
                onClick={handleProfileNavigation}
              >
                Profile
              </button>
              <button
                className="block px-4 py-2 hover:bg-indigo-100 w-full text-left"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-circle">
          <FaComments />
        </button>
      </div>
    </nav>
  );
}
