"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import Nav from '../components/nav';
import { Loading } from '../components/loading';
import  Bug  from '../components/error';

export default function FollowersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/followers";

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch followers');
        }

        const data = await response.json();
        setFollowers(data.followers);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFollow = async (userId) => {
    const followResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/follow?userid=${userId}`, {
      method: "POST",
      credentials: 'include',
    });

    if (followResponse.ok) {
      const responseData = await followResponse.json();
      setFollowers((prevFollowers) =>
        prevFollowers.map(follower => 
          follower.user_id === userId 
            ? { ...follower, following: responseData.status === 'accepted', status: responseData.status } 
            : follower
        )
      );
    }
  };

  const filteredFollowers = followers && followers.length > 0 
  ? followers.filter(follower => 
      follower.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${follower.first_name || ''} ${follower.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  const handleProfileClick = (userId) => {
    router.push(`/profilepage/${userId}`); 
  };

  if (loading) return <Loading />;
  if (error) return <Bug message={"Server Error"} />;

  return (
    <>
      <Nav />
      <br />
      <div className="max-w-5xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Followers</h1>
            
            <div className="mb-6 relative">
              <input 
                type="text" 
                placeholder="Search followers" 
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute left-4 top-4 text-gray-400" />
            </div>

            <div className="space-y-4">
              {filteredFollowers.length > 0 ? filteredFollowers.map((follower) => (
                <div 
                  key={follower.user_id} 
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
                  onClick={() => handleProfileClick(follower.user_id)} 
                >
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/${follower.image}`} 
                    alt={`${follower.first_name} ${follower.last_name}`}
                    className="h-16 w-16 rounded-full object-cover mr-4"
                  />
                  <div className="flex-grow">
                    <p className="text-gray-800 font-medium">
                      {follower.first_name} {follower.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{follower.nickname}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleFollow(follower.user_id);
                    }}
                    className={`flex items-center px-4 py-2 rounded-full transition duration-300 ${
                      follower.following 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {follower.following ? (
                      <>
                        <FaUserCheck className="mr-2" /> Following
                      </>
                    ) : follower.status === "pending" ? (
                      <span className="text-gray-500">Request Sent</span> // Indicate the request was sent
                    ) : (
                      <>
                        <FaUserPlus className="mr-2" /> Follow
                      </>
                    )}
                  </button>
                </div>
              )) : (
                <p className="text-gray-500">No followers found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}