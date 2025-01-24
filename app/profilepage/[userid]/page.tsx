"use client";

import React, { useState, useEffect } from 'react';
import { FaLock, FaGlobe, FaUserSecret, FaBirthdayCake, FaUserPlus, FaComments } from 'react-icons/fa';
import Nav from '../../components/nav';
import { Loading } from '../../components/loading';
import  Bug  from '../../components/error';
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

    fetchUserData();
  }, [serverUrl]);

  if (userInfo.match === true) {
    redirect("/profile");
  }

  const handleNavigateToChat = (receiverId) => {
    if (!userInfo.chat) {
      alert("You need to follow this user to chat with them.");
    } else {
      router.push(`/chat?userId=${receiverId}`); // Navigate to the chat page
    }
  };

  const handleFollow = async () => {
    const followResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/follow?userid=${userid}`, {
      method: "POST",
      credentials: 'include',
    });

    if (followResponse.ok) {
      const responseData = await followResponse.json();
      if (responseData.status === 'accepted') {
        setUserInfo((prev) => ({
          ...prev,
          followersCount: prev.followersCount + 1,
          followStatus: 'following',
          chat: true,  // Allow chatting after following
        }));
      } else if (responseData.status === 'pending') {
        setUserInfo((prev) => ({
          ...prev,
          followStatus: 'request_sent',
        }));
      }
    }
  };

  const handleUnfollow = async () => {
    try {
      const unfollowResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/unfollow?userid=${userid}`, {
        method: "POST",
        credentials: 'include',
      });

      if (unfollowResponse.ok) {
        const responseData = await unfollowResponse.json();
        if (responseData.status === 'unfollowed') {
          setUserInfo((prev) => ({
            ...prev,
            followersCount: prev.followersCount - 1,
            followStatus: 'not_following',
            chat: false,  // Disable chat when unfollowing
          }));
        }
      } else {
        console.error('Failed to unfollow:', await unfollowResponse.json());
      }
    } catch (error) {
      console.error('Error during unfollow:', error);
    }
  };

  useEffect(() => {
    if (userInfo.match) {
      router.push('/profile');
    }
  }, [userInfo.match, router]);

  const navigateToFollowers = () => {
    if (!userInfo.private || userInfo.followStatus === 'following') {
      router.push(`/followers/${userid}`);
    }
  };

  const navigateToFollowing = () => {
    if (!userInfo.private || userInfo.followStatus === 'following') {
      router.push(`/followings/${userid}`);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Bug message="User not found" />;
  }

  return (
    <>
      <Nav />
      <br />
      <div className="max-w-5xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-lg">
          <div className="md:flex">
            <div className="md:flex-shrink-0 relative">
              <div className="h-48 w-full md:w-48 bg-gradient-to-br mt-8 flex flex-col items-center justify-center">
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
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
                {`${userInfo.firstName} ${userInfo.lastName}`}
              </h1>
              <p className="text-lg text-gray-600">{userInfo.username}</p>
              <span className="flex items-center">
                <FaUserSecret className="mr-1" />
                {(userInfo.private ? 'Private' : 'Public')}
              </span>
              <p className="text-gray-700 mb-4">{userInfo.bio}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
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
                <div className="text-center cursor-pointer" onClick={navigateToFollowers}>
                  <span className="block text-2xl font-bold text-gray-900">{userInfo.followersCount}</span>
                  <span className="text-gray-600">Followers</span>
                </div>
                <div className="text-center cursor-pointer" onClick={navigateToFollowing}>
                  <span className="block text-2xl font-bold text-gray-900">{userInfo.followingCount}</span>
                  <span className="text-gray-600">Following</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-gray-900">{userInfo.postCount}</span>
                  <span className="text-gray-600">Posts</span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
  <div className="flex items-center gap-2">
    {userInfo.followStatus === 'following' ? (
      <>
        <button className="bg-gray-500 text-white px-4 py-2 rounded" disabled>
          Following
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
          onClick={handleUnfollow}
        >
          Unfollow
        </button>
      </>
    ) : userInfo.followStatus === 'request_sent' ? (
      <button className="bg-gray-500 text-white px-4 py-2 rounded" disabled>
        Follow Request Sent
      </button>
    ) : (
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
        onClick={handleFollow}
      >
        <FaUserPlus className="inline mr-1" /> Follow
      </button>
    )}
    <button
      onClick={() => handleNavigateToChat(userid)}
      className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300 ${
        !userInfo.chat ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={!userInfo.chat}
    >
      <FaComments className="inline mr-1" /> Chat
    </button>
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