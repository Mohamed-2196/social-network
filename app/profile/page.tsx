"use client";
import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaEdit, FaLock, FaGlobe, FaUserFriends, FaImages } from 'react-icons/fa';
import Nav from '../components/nav';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState({
    image: "",
    name: '',
    username: '',
    email: '',
    bio: '',
    joinDate: '',
    birthday: '',
    accountType: '',
    followersCount: 0,
    followingCount: 0,
    postCount: 0,
  });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/profile";
  const imageBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/uploads/";

  useEffect(() => {
    fetch(serverUrl, { method: "POST", credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setUserInfo({
          name: `${data.first_name} ${data.last_name}`,
          username: `@${data.nickname}`,
          email: data.email,
          bio: data.about,
          joinDate: `Joined ${new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          birthday: `Birthday: ${new Date(data.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
          accountType: data.account_type,
          image: data.image ? imageBaseUrl + data.image : `${imageBaseUrl}empty.webp`,
          followersCount: data.followers_count,
          followingCount: data.following_count,
          postCount: data.post_count,
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="p-8 bg-white bg-opacity-20 rounded-full backdrop-blur-lg">
          <div className="w-16 h-16 border-4 border-white border-dashed rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 to-pink-500">
        <div className="p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <br />
        <div className="max-w-5xl mx-auto">
          <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg">
            <div className="md:flex">
              <div className="md:flex-shrink-0 relative">
                <div className="h-48 w-full md:w-48 bg-gradient-to-br mt-8 flex items-center justify-center ">
                  <img
                    className="h-40 w-40 rounded-full border-2 border-blue-600 shadow-lg object-cover"
                    src={userInfo.image || 'https://picsum.photos/150/150'}
                    alt="Profile"
                  />
                </div>
                <div className="absolute bottom-0 right-0 mb-2 mr-2">
                  <button className="bg-white text-blue-500 rounded-full p-2 shadow-lg hover:bg-blue-100 transition duration-300">
                    <FaEdit size={20} />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{userInfo.name}</h1>
                    <p className="text-lg text-gray-600">{userInfo.username}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{userInfo.bio}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <span>{userInfo.email}</span>
                  <span>{userInfo.joinDate}</span>
                  <span>{userInfo.birthday}</span>
                </div>
                <div className="flex space-x-8">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{userInfo.followersCount}</span>
                    <span className="text-gray-600">Followers</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{userInfo.followingCount}</span>
                    <span className="text-gray-600">Following</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{userInfo.postCount}</span>
                    <span className="text-gray-600">Posts</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50">
  <div className="flex mb-4 border-b border-gray-200">
    <button
      className={`w-1/2 pb-2 font-semibold ${activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
      onClick={() => setActiveTab('posts')}
    >
      Posts
    </button>
    <button
      className={`w-1/2 pb-2 font-semibold ${activeTab === 'liked' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
      onClick={() => setActiveTab('liked')}
    >
      Liked Posts
    </button>
  </div>

              <div className="grid grid-cols1 md:grid-cols2 gap6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration300">
                    {post.image && (
                      <img src={post.image} alt={`Post ${post.id}`} className="w-full h48 object-cover" />
                    )}
                    <div className="p4">
                      <p className="textgray800 mb2">{post.content}</p>
                      <div className="flex justify-between textgray500">
                        <button className="flex itemscenter space-x1 hover:textblue500 transition duration300">
                          <FaHeart />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex itemscenter space-x1 hover:textpurple500 transition duration300">
                          <FaComment />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
