"use client";
import React, { useState, useEffect } from "react";
import Nav from "./nav";
import { FaImage, FaHeart, FaComment } from 'react-icons/fa';

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postData, setPostData] = useState({
    content: "",
    privacy: "public",
    image: null,
  });
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState([]);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  useEffect(() => {
    const darkModeSetting = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeSetting);
    document.body.classList.toggle('dark', darkModeSetting);
    
    // Fetch posts and followers on component mount
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${serverUrl}/home`, {
        method: 'GET',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
  
      const data = await response.json();
  
      // Ensure public_posts exists and is an array before mapping
      const postsArray = Array.isArray(data.posts) ? data.posts : [];
      setPosts(postsArray.map(post => ({
        id: post.id,
        user: post.author_first_name + ' ' + post.author_last_name,
        authorId: post.author_id,  // Assuming this is available in the response
        content: post.content_text,
        privacy: post.privacy,
        avatar: post.author_image,
        likeCount: post.like_count,
        userLiked: post.user_liked,
        image: post.content_image,
      })));
  
      // Ensure followers exists and is an array before setting
      const followersArray = Array.isArray(data.followers) ? data.followers : [];
      setFollowers(followersArray);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.body.classList.toggle('dark', newMode);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostData({ ...postData, image: file });
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!postData.content.trim() && !postData.image) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("content", postData.content);
      formDataToSend.append("privacy", postData.privacy);
      if (postData.image) {
        formDataToSend.append('image', postData.image);
      }
      if (postData.privacy === 'private') {
        formDataToSend.append('selectedFollowers', selectedFollowers.join(',')); // Join IDs as a comma-separated string
      }

      const response = await fetch(`${serverUrl}/createpost`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.json();
        console.error("Error response:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Post created successfully", data);
      setPostData({ content: '', privacy: 'public', image: null });
      setSelectedFollowers([]); // Clear selected followers after submission
      fetchPosts(); // Refresh posts after creating a new one
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  const handleLikeToggle = async (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newLikedState = !post.userLiked;
        return {
          ...post,
          userLiked: newLikedState,
          likeCount: newLikedState ? post.likeCount + 1 : post.likeCount - 1
        };
      }
      return post;
    });

    setPosts(updatedPosts);

    try {
      const response = await fetch(`${serverUrl}/likepost`, {
        method: 'POST',
        body: JSON.stringify({ postId, like: !posts.find(p => p.id === postId).userLiked }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setPosts(posts); // Revert to the previous state if there's an error
    }
  };

  const toggleFollowerSelection = (followerId) => {
    setSelectedFollowers(prevState => 
      prevState.includes(followerId) 
        ? prevState.filter(item => item !== followerId) 
        : [...prevState, followerId]
    );
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} min-h-screen flex flex-col`}>
      <Nav isDarkMode={isDarkMode} />
      <div className="container mx-auto flex flex-col md:flex-row gap-4 p-4">
        <aside className="w-full md:w-1/4">
          <div
            className={`card ${
              isDarkMode ? "bg-gray-800" : "bg-base-100"
            } shadow-xl`}
          >
            <div className="card-body">
              <h2 className="card-title">Suggestions to Follow</h2>
              <div className="space-y-2">
                {followers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={`${serverUrl}/uploads/${user.image}`} alt={user.nickname} />
                        </div>
                        <a
                          href={`/profile/${user.toLowerCase()}`}
                          className="link link-hover"
                        >
                          {user}
                        </a>
                      </div>
                      <a href={`${serverUrl}/profilepage/${user.id}`} className="link link-hover">{user.nickname}</a>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          <div className="flex justify-end mb-4">
            <input
              type="checkbox"
              id="dark-mode-toggle"
              className="hidden peer"
              checked={isDarkMode}
              onChange={handleToggleDarkMode}
            />
            <label
              htmlFor="dark-mode-toggle"
              className={`flex items-center justify-center w-12 h-12 rounded-full border ${
                isDarkMode
                  ? "border-gray-400 bg-gray-600"
                  : "border-gray-300 bg-gray-200"
              } cursor-pointer transition-all`}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-700">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </label>
          </div>

          <div
            className={`card ${
              isDarkMode ? "bg-gray-800" : "bg-base-100"
            } shadow-xl mb-4`}
          >
            <div
              className={`card-body ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              <h2 className="card-title">What's on your mind?</h2>
              <form onSubmit={handlePostSubmit}>
                <textarea
                  className={`textarea textarea-bordered w-full ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-400"
                      : "bg-white text-gray-900"
                  }`}
                  placeholder="Write something..."
                  value={postData.content}
                  onChange={(e) =>
                    setPostData({ ...postData, content: e.target.value })
                  }
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <label className="btn btn-outline btn-sm">
                      <FaImage className="mr-2" />
                      Upload Image
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                    {postData.image && (
                      <span className="text-success">Image uploaded</span>
                    )}
                  </div>
                  <select
                    className={`select select-bordered select-sm ${
                      isDarkMode ? "bg-gray-700" : ""
                    }`}
                    value={postData.privacy}
                    onChange={(e) => {
                      const newPrivacy = e.target.value;
                      setPostData({ ...postData, privacy: newPrivacy });
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="almost_private">Almost Private</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                {postData.privacy === 'private' && (
                  <div className="mt-4">
                    <h3 className="font-semibold">Select Followers:</h3>
                    {followers.map((follower, index) => (
                      <label key={index} className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedFollowers.includes(follower.id)} // Ensure you're checking the ID
                          onChange={() => toggleFollowerSelection(follower.id)} // Pass only the ID
                          className="mr-2" 
                        />
                        <div className="flex items-center gap-2">
                          <div className="avatar">
                            <div className="w-10 rounded-full">
                              <img src={`${serverUrl}/uploads/${follower.image}`} alt={`${follower.nickname}'s avatar`} />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{follower.nickname}</div>
                            <div>{follower.first_name} {follower.last_name}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <div className="card-actions justify-end mt-2">
                  <button type="submit" className="btn btn-primary">
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`card shadow-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-base-100"
                }`}
              >
                <div className="card-body">
                  <div className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={`${serverUrl}/uploads/${post.avatar}`} alt={post.user} />
                      </div>
                    </div>
                    <a href={`/profilepage/${post.authorId}`} className="font-semibold link link-hover">{post.user}</a>
                  </div>
                  <p>{post.content}</p>
                  {post.image && (
                    <div className="mt-2">
                      <img src={`${serverUrl}/uploads/${post.image}`} alt="Post image" className="w-full h-auto rounded" />
                    </div>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleLikeToggle(post.id)}
                        className={`btn btn-ghost btn-sm ${post.userLiked ? 'text-red-500' : ''}`}
                      >
                        <FaHeart /> {post.likeCount}
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <FaComment />
                      </button>
                    </div>
                    <span className={`badge ${post.privacy === 'public' ? 'badge-info' : post.privacy === 'almost_private' ? 'badge-warning' : 'badge-error'}`}>
                      {post.privacy}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {posts2 && (
              <>
                {posts2.map((post) => (
                  <>
                    <div>{post.UID} </div>
                    <div>{post.Content}</div>
                    <div>{post.LikeCount}</div>
                  </>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}