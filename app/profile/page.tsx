"use client";
import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment } from 'react-icons/fa';
import Nav from '../components/nav';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    joinDate: '',
    birthday: '', // Added birthday field
    accountType: '', // Added account type field
  });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/profile";

  useEffect(() => {
    fetch(serverUrl, { 
      method: "POST", // Check if this should be GET
      credentials: 'include' 
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => {
      if (!data) {
        throw new Error('No data received');
      }
      setUserInfo({
        name: `${data.first_name} ${data.last_name}`,
        username: `@${data.nickname}`,
        email: `${data.email}`,
        bio: data.about,
        joinDate: `Joined ${new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, // Updated to joined_at
        birthday: `Birthday: ${new Date(data.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, // Format birthday
        accountType: data.account_type, // Extract account type
      });
      setIsLoading(false);
    })
    .catch(err => {
      console.error('Fetch error:', err);
      setError(err);
      setIsLoading(false);
    });
  }, []);

  // Uncomment if you want to load user posts
  // useEffect(() => {
  //   fetch('/api/user-posts', { credentials: 'include' })
  //     .then(res => res.json())
  //     .then(data => {
  //       setPosts(data);
  //     })
  //     .catch(err => {
  //       console.error('Failed to fetch posts:', err);
  //     });
  // }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <Nav />
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex mb-6">
              <div className="flex flex-col items-center mr-8">
                <img
                  src={userInfo.image || 'https://picsum.photos/150/150'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-2 border-pink-500 mb-4"
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
                  Edit Profile
                </button>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{userInfo.name}</h1>
                    <p className="text-gray-600">{userInfo.username}</p>
                    <p className="text-gray-600">{userInfo.email}</p>
                    <p className="text-gray-600">
  {userInfo.accountType === "true" ? "Private" : "Public"}
</p>                  </div>
                  {/* Followers and Following buttons */}
                </div>
                <div className="mb-6">
                  <p className="mb-2">{userInfo.bio}</p>
                  <p className="text-gray-600 mb-1">{userInfo.joinDate}</p>
                  <p className="text-gray-600 mb-1">{userInfo.birthday}</p> {/* Display birthday */}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex mb-4">
                {/* Tabs for posts and liked posts */}
              </div>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border-b border-gray-200 pb-4">
                    {post.image ? (
                      <img src={post.image} alt={`Post ${post.id}`} className="w-full h-auto mb-4" />
                    ) : null}
                    <p className="mb-2">{post.content}</p>
                    <div className="flex space-x-4 text-gray-500">
                      <button className="flex items-center space-x-1">
                        <FaHeart />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1">
                        <FaComment />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}