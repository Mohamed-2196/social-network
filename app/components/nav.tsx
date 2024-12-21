"use client"
import { FaBell, FaComments, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Nav() {
  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  const handleLogout = async () => {
    try {
      const response = await fetch(`${serverUrl}/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session management
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
  const handlehome = () => {
    router.push('/'); // Navigate to the profile page
  };

  return (
    <nav className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <button className="btn btn-ghost normal-case text-xl" onClick={handlehome} 
        >SocialApp</button>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input type="text" placeholder="Search users" className="input input-bordered w-24 md:w-auto" />
        </div>
        <div className="relative group">
          <button 
            className="btn btn-ghost btn-circle" 
            onClick={handleProfileNavigation} // Navigate to profile on click
          >
            <FaUser />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              className="block px-4 py-2 text-gray-700 hover:bg-indigo-100 w-full text-left"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <button className="btn btn-ghost btn-circle">
          <div className="indicator">
            <FaBell />
            <span className="badge badge-xs badge-primary indicator-item">3</span>
          </div>
        </button>
        <button className="btn btn-ghost btn-circle">
          <FaComments />
        </button>
      </div>
    </nav>
  );
}