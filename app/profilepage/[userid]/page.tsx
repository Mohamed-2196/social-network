"use client";

import React, { useState, useEffect } from 'react';
import { FaLock, FaGlobe, FaUserSecret, FaBirthdayCake, FaUserPlus, FaComments } from 'react-icons/fa';
import Nav from '../../components/nav';
import { Loading } from '../../components/loading';
import { Bug } from '../../components/error';
import Post from '../../components/posts';
import { redirect, useParams, useRouter } from "next/navigation";

export default function UserProfilePage() {
  const { userid } = useParams();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    image: "",
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    bio: '',
    joinDate: '',
    birthday: '',
    accountType: '',
    private: false,
    followersCount: 0,
    followingCount: 0,
    postCount: 0,
    followStatus: '',
    match: false,
    chat: false,
  });

  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const serverUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/user/profile?userid=${userid}`;
  const imageBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/uploads/";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: "GET",
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setUserInfo({
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          username: `@${data.user.nickname}`,
          email: data.user.email,
          bio: data.user.about,
          joinDate: `Joined ${new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          birthday: new Date(data.user.birthday).toISOString().split('T')[0],
          accountType: data.user.account_type,
          private: data.user.private,
          image: data.user.image ? `${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/${data.user.image}` : `${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/empty.webp`,
          followersCount: data.user.followers_count,
          followingCount: data.user.following_count,
          postCount: data.user.post_count,
          followStatus: data.user.follow_status,
          match: data.user.match,
          chat: data.user.chat
        });
        setPosts(data.posts || []);
        setLikedPosts(data.liked_posts || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeSetting);
    document.body.classList.toggle("dark", darkModeSetting);

    fetchUserData();
  }, [serverUrl]);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  if (userInfo.match === true) {
    redirect("/profile");
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Bug message="User not found" />;
  }

  return (
    <>
      <Nav isDarkMode={isDarkMode} />
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-grey-100 text-gray-900'}`}>
      <div className={`rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg ${isDarkMode ? 'bg-gray-700 bg-opacity-90' : 'bg-white bg-opacity-90'}`}>
          <div className="md:flex">
            <div className="md:flex-shrink-0 relative">
              <div className={`h-48 w-full md:w-48 flex flex-col items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br'}`}>
                <div className="flex flex-col items-center mt-4">
                  <img
                    className="h-40 w-40 rounded-full border-2 border-blue-600 shadow-lg object-cover"
                    src={userInfo.image || 'https://picsum.photos/150/150'}
                    alt="Profile"
                  />
                </div>
              </div>
            </div>
            <div className="p-8 flex-grow">
              <h1 className={`text-3xl font-extrabold mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {`${userInfo.firstName} ${userInfo.lastName}`}
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userInfo.username}</p>
              <span className="flex items-center">
                <FaUserSecret className={`mr-1 ${isDarkMode ? 'text-gray-300' : ''}`} />
                {(userInfo.private ? 'Private' : 'Public')}
              </span>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{userInfo.bio}</p>
              <div className={`flex items-center space-x-4 text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>
                  <FaGlobe className="inline mr-1" />
                  <span>{userInfo.email}</span>
                </span>
                <span>
                  <FaLock className="inline mr-1" />
                  <span>{userInfo.joinDate}</span>
                </span>
                <span>
                  <FaBirthdayCake className="inline mr-1" />
                  <span>{userInfo.birthday}</span>
                </span>
              </div>
              <div className="flex space-x-8 mt-4">
                <div className={`text-center cursor-pointer ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <span className="block text-2xl font-bold">{userInfo.followersCount}</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Followers</span>
                </div>
                <div className={`text-center cursor-pointer ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <span className="block text-2xl font-bold">{userInfo.followingCount}</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Following</span>
                </div>
                <div className={`text-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <span className="block text-2xl font-bold">{userInfo.postCount}</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Posts</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-8 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex mb-4 border-b border-gray-200">
              <button
                className={`w-1/2 pb-2 font-semibold ${activeTab === 'posts' ? 'border-b-2 border-blue-500' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                onClick={() => setActiveTab('posts')}
              >
                Posts
              </button>
              <button
                className={`w-1/2 pb-2 font-semibold ${activeTab === 'liked' ? 'border-b-2 border-blue-500' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                onClick={() => setActiveTab('liked')}
              >
                Liked Posts
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'posts' && posts.length > 0 && posts.map((post) => (
                <Post
                  key={post.id}
                  id={post.id}
                  image={imageBaseUrl + post.content_image}
                  content={post.content_text}
                  likeCount={post.like_count}
                  userLiked={post.user_liked}
                  authorId={post.author_id}
                  authorFirstName={post.author_first_name}
                  authorLastName={post.author_last_name}
                  authorImage={imageBaseUrl + post.author_image}
                />
              ))}
              {activeTab === 'liked' && likedPosts.length > 0 && likedPosts.map((post) => (
                <Post
                  key={post.id}
                  id={post.id}
                  image={imageBaseUrl + post.content_image}
                  content={post.content_text}
                  likeCount={post.like_count}
                  userLiked={post.user_liked}
                  authorId={post.author_id}
                  authorFirstName={post.author_first_name}
                  authorLastName={post.author_last_name}
                  authorImage={imageBaseUrl + post.author_image}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
