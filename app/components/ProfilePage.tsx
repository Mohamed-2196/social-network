'use client';
import React, { useState } from 'react';
import { FaUser, FaPen, FaHeart, FaComment, FaMapMarkerAlt, FaLink, FaCalendarAlt } from 'react-icons/fa';
import Nav from './nav';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const user = {
    name: 'John Doe',
    username: '@johndoe',
    bio: 'Passionate developer | Coffee enthusiast | Nature lover',
    location: 'New York, USA',
    website: 'https://johndoe.com',
    joinDate: 'Joined September 2020',
    posts: 142,
    followers: 1234,
    following: 567,
  };

  const [userInfo, setUserInfo] = useState(user);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // Here you would typically send the updated info to your backend
  };

  const posts = [
    { id: 1, content: 'Just launched my new project!', likes: 24, comments: 5 },
    { id: 2, content: 'Beautiful sunset at the beach today.', likes: 56, comments: 12, image: 'https://picsum.photos/300/300?random=2' },
    { id: 3, content: 'Excited for the upcoming tech conference!', likes: 18, comments: 3 },
    { id: 4, content: 'Working on a new side project.', likes: 10, comments: 2, image: 'https://picsum.photos/300/300?random=4' },
    { id: 5, content: 'Enjoying the weekend!', likes: 30, comments: 6, image: 'https://picsum.photos/300/300?random=5' },
  ];

  return (
    <>
    <Nav />
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex mb-6">
            <div className="flex flex-col items-center mr-8">
              <img
                src="https://picsum.photos/150/150"
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-pink-500 mb-4"
              />
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-full">
                <FaPen className="inline-block mr-2" />
                Edit Profile
              </button>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-gray-600">{user.username}</p>
                </div>
                <div className="flex space-x-4">
                  <button className="text-center" onClick={() => setShowFollowers(true)}>
                    <span className="font-bold">{user.followers}</span>
                    <p className="text-gray-600">Followers</p>
                  </button>
                  <button className="text-center" onClick={() => setShowFollowing(true)}>
                    <span className="font-bold">{user.following}</span>
                    <p className="text-gray-600">Following</p>
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <p className="mb-2">{user.bio}</p>
                <p className="text-gray-600 flex items-center mb-1">
                  <FaMapMarkerAlt className="mr-2" />
                  {user.location}
                </p>
                <p className="text-gray-600 flex items-center mb-1">
                  <FaLink className="mr-2" />
                  <a href={user.website} className="text-blue-500 hover:underline">
                    {user.website}
                  </a>
                </p>
                <p className="text-gray-600 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  {user.joinDate}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex mb-4">
              <button
                className={`flex-1 py-2 ${
                  activeTab === 'posts'
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('posts')}
              >
                Posts
              </button>
              <button
                className={`flex-1 py-2 ${
                  activeTab === 'liked'
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('liked')}
              >
                Liked Posts
              </button>
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

    {/* Followers Modal */}
    {showFollowers && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Followers</h2>
          {/* Add list of followers here */}
          <button onClick={() => setShowFollowers(false)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    )}

    {/* Following Modal */}
    {showFollowing && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Following</h2>
          {/* Add list of following here */}
          <button onClick={() => setShowFollowing(false)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    )}
    </>
  );
}
