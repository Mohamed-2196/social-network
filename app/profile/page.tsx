"use client";

import React, { useState, useEffect } from 'react';
import { FaLock, FaGlobe, FaUserSecret, FaBirthdayCake } from 'react-icons/fa';
import Nav from '../components/nav';
import { Loading } from '../components/loading';
import { Bug } from '../components/error';
import Post from '../components/posts'; // Import the Post component
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
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
  });
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]); // New state for liked posts
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    email: '',
    birthday: '',
    accountType: '',
    nickname: '',
    firstName: '',
    lastName: '',
    bio: '',
    private: false,
    avatar: null // Add avatar state
  });
  const [isDarkMode, setIsDarkMode] = useState(false); // State for dark mode toggle
  const router = useRouter(); // Initialize router

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/profile";
  const postsUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/createdposts"; // New endpoint for fetching posts
  const imageBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/uploads/";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setUserInfo({
          firstName: data.first_name,
          lastName: data.last_name,
          username: `@${data.nickname}`,
          email: data.email,
          bio: data.about,
          joinDate: `Joined ${new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          birthday: new Date(data.birthday).toISOString().split('T')[0],
          accountType: data.account_type,
          private: data.private,
          image: data.image ? imageBaseUrl + data.image : `${imageBaseUrl}empty.webp`,
          followersCount: data.followers_count,
          followingCount: data.following_count,
          postCount: data.post_count,
        });
        setEditData({
          email: data.email,
          birthday: new Date(data.birthday).toISOString().split('T')[0],
          accountType: data.account_type,
          nickname: data.nickname,
          firstName: data.first_name,
          lastName: data.last_name,
          bio: data.about,
          private: data.private,
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await fetch(postsUrl, {
          method: "POST",
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.created_posts); // Set created posts
        setLikedPosts(data.liked_posts); // Set liked posts
      } catch (err) {
        console.error('Fetch posts error:', err);
        setError(err);
      }
    };
    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeSetting);
    document.body.classList.toggle("dark", darkModeSetting);
    
    fetchUserData();
    fetchPosts(); // Fetch posts on component mount
  }, []);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    const formData = new FormData();
    for (const key in editData) {
      formData.append(key, editData[key]);
    }

    try {
      const response = await fetch(`${serverUrl}/edit`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setUserInfo(prev => ({
        ...prev,
        email: data.email,
        birthday: `Birthday: ${new Date(data.birthday).toLocaleDateString('en-US')}`,
        accountType: data.account_type,
        username: `@${data.nickname}`,
        firstName: data.first_name,
        lastName: data.last_name,
        bio: data.about,
        private: data.private,
        image: data.image ? `${imageBaseUrl}${data.image}` : prev.image // Update the image if there's a new one
      }));
      setIsEditing(false); // Exit editing mode after saving
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.'); // Notify user
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData((prev) => ({ ...prev, avatar: file }));
    }
  };
  const handleNavigate = (path) => {
    router.push(path); // Navigate to the desired route
  };
  const handleChange = (e, field) => {
    setEditData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.body.classList.toggle("dark", newMode);
  };
  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Bug message="An error occurred while fetching data." />;
  }

  return (
    <>
    <Nav isDarkMode={isDarkMode} />
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-grey-100 text-gray-900'}`}>
      <div className={`rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-grey-100 text-black'}`}>
          <div className="md:flex">
            <div className="md:flex-shrink-0 relative">
              <div className="h-48 w-full md:w-48 bg-gradient-to-br mt-8 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center mt-4">
                  <img
                    className="h-40 w-40 rounded-full border-2 border-blue-600 shadow-lg object-cover"
                    src={userInfo.image || 'https://picsum.photos/150/150'}
                    alt="Profile"
                  />
                  {isEditing && (
                    <input
                      type="file"
                      name="avatar"
                      className="file-input file-input-bordered file-input-primary w-full" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  )}
                </div>
              </div>
            </div>
      <div className={`p-8 flex-grow ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}>

              <h1 className="text-3xl font-extrabold mb-1">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => handleChange(e, 'firstName')}
                      className={`border rounded p-1 mr-2 ${isDarkMode ? 'text-black' : 'text-black'}`} 
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => handleChange(e, 'lastName')}
                      className={`border rounded p-1 ${isDarkMode ? 'text-black' : 'text-black'}`} 
                      placeholder="Last Name"
                    />
                  </>
                ) : (
                  `${userInfo.firstName} ${userInfo.lastName}`
                )}
              </h1>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.nickname}
                  onChange={(e) => handleChange(e, 'nickname')}
                  className={`border rounded p-1 mb-2 ${isDarkMode ? 'text-black' : 'text-black'}`}
                  placeholder="Nickname"
                />
              ) : (
                <p className="text-lg text-gray-600">{userInfo.username}</p>
              )}
              <span className="flex items-center">
                <FaUserSecret className="mr-1" />
                {isEditing ? (
                  <select
                    value={editData.private ? 'true' : 'false'}
                    onChange={(e) => handleChange(e, 'private')}
                    className={`border rounded p-1 ${isDarkMode ? 'text-black' : 'text-black'}`} // Ensure text is black
                    >
                    <option value="true">Private</option>
                    <option value="false">Public</option>
                  </select>
                ) : (
                  (userInfo.private ? 'Private' : 'Public') 
                )}
              </span>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => handleChange(e, 'bio')}
                  className={`border rounded p-1 mb-4 w-full mr-1 ${isDarkMode ? 'text-black' : 'text-black'}`} 
                  placeholder="Bio"
                />
              ) : (
                <p className="text-gray-700 mb-4">{userInfo.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>
                  <FaGlobe className="inline mr-1" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleChange(e, 'email')}
                      className="border rounded p-1"
                    />
                  ) : (
                    <span>{userInfo.email}</span>
                  )}
                </span>
                <span>
                  <FaLock className="inline mr-1" />
                  <span>{userInfo.joinDate}</span>
                </span>
                <span>
                  <FaBirthdayCake className="inline mr-1" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.birthday}
                      onChange={(e) => handleChange(e, 'birthday')}
                      className="border rounded p-1"
                    />
                  ) : (
                    <span>{userInfo.birthday}</span>
                  )}
                </span>
              </div>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                >
                  Edit Profile
                </button>
              )}
 <div className="flex space-x-8 mt-4">
      <div
        className="text-center cursor-pointer"
        onClick={() => handleNavigate('/followers')}
      >
        <span className="block text-2xl font-bold text-gray-900">
          {userInfo.followersCount}
        </span>
        <span className="text-gray-600">Followers</span>
      </div>
      <div
        className="text-center cursor-pointer"
        onClick={() => handleNavigate('/followings')}
      >
        <span className="block text-2xl font-bold text-gray-900">
          {userInfo.followingCount}
        </span>
        <span className="text-gray-600">Followings</span>
      </div>
      <div className="text-center">
        <span className="block text-2xl font-bold text-gray-900">
          {userInfo.postCount}
        </span>
        <span className="text-gray-600">Posts</span>
      </div>
    </div>
            </div>
          </div>
          <div className={`px-8 py-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
  {activeTab === 'posts' && posts && posts.length > 0 && posts.map((post) => (
    <Post
    key={post.id}
    id={post.id}
    image={imageBaseUrl + post.content_image}
    content={post.content_text}
    likeCount={post.like_count} // Adjusted to match the field names
    userLiked={post.user_liked} // Adjusted to match the field names
    authorId={post.author_id} // New prop for author ID
    authorFirstName={post.author_first_name} // New prop for author's first name
    authorLastName={post.author_last_name} // New prop for author's last name
    authorImage={imageBaseUrl+post.author_image} // New prop for author's image
    />
  ))}
  
  {activeTab === 'liked' && likedPosts && likedPosts.length > 0 && likedPosts.map((post) => (
    <Post
      key={post.id}
      id={post.id}
      image={imageBaseUrl + post.content_image}
      content={post.content_text}
      likeCount={post.like_count} // Adjusted to match the field names
      userLiked={post.user_liked} // Adjusted to match the field names
      authorId={post.author_id} // New prop for author ID
      authorFirstName={post.author_first_name} // New prop for author's first name
      authorLastName={post.author_last_name} // New prop for author's last name
      authorImage={imageBaseUrl+post.author_image} // New prop for author's image
    />
  ))}
</div>
          </div>
        </div>
      </div>
    </>
  );
}

