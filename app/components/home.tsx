'use client';
import React, { useState, useEffect } from 'react';
import Nav from "./nav";
import { FaImage } from 'react-icons/fa';

export default function HomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false); // Track dark mode state
  const [posts, setPosts] = useState([
    { id: 1, user: 'Yousif', content: 'I am just a gay boy!', privacy: 'public', avatar: '' },
  ]);
  const [postData, setPostData] = useState({
    content: '',
    privacy: 'public',
    image: null,
  });

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  // Sync with local storage and apply dark mode
  useEffect(() => {
    const darkModeSetting = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkModeSetting);
    document.body.classList.toggle('dark', darkModeSetting);
  }, []);

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.body.classList.toggle('dark', newMode);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; // Get the first file
    if (file) {
      setPostData({ ...postData, image: file }); // Store the file object
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!postData.content.trim() && !postData.image) {
      return; // Prevent submission if both are empty
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('content', postData.content);
      formDataToSend.append('privacy', postData.privacy);
      if (postData.image) {
        formDataToSend.append('image', postData.image); // Append the file
      }
      const response = await fetch(`${serverUrl}/createpost`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.json();
        console.error('Error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Post created successfully", data);

      const newPost = {
        id: posts.length + 1,
        user: 'CurrentUser',
        content: postData.content,
        privacy: postData.privacy,
        avatar: '/avatars/current-user.jpg',
        image: URL.createObjectURL(postData.image), // Create a URL for preview
      };

      setPosts([newPost, ...posts]);
      setPostData({ content: '', privacy: 'public', image: null }); // Reset form data
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  return (
    <div
      className={`${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'
      } min-h-screen flex flex-col`}
    >
      <Nav isDarkMode={isDarkMode} />

      <div className="container mx-auto flex flex-col md:flex-row gap-4 p-4">
        <aside className="w-full md:w-1/4">
          <div className={`card ${isDarkMode ? 'bg-gray-800' : 'bg-base-100'} shadow-xl`}>
            <div className="card-body">
              <h2 className="card-title">Suggestions to Follow</h2>
              <div className="space-y-2">
                {['Yousif', 'Reem', 'Sayed Hasan', 'Fatima'].map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={`/avatars/${user.toLowerCase()}.jpg`} alt={user} />
                        </div>
                      </div>
                      <a href={`/profile/${user.toLowerCase()}`} className="link link-hover">{user}</a>
                    </div>
                    <button className="btn btn-primary btn-xs">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Groups Section */}
          <div className={`card ${isDarkMode ? 'bg-gray-800' : 'bg-base-100'} shadow-xl mt-4`}>
            <div className="card-body">
              <h2 className="card-title">Groups</h2>
              <div className="form-control">
              <input 
             type="text" 
             placeholder="Search groups" 
            className={`input input-bordered w-full max-w-xs ${isDarkMode ? 'bg-gray-700 text-gray-400 placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'}`} 
            />              </div>
              <div className="space-y-2 mt-2">
                {['Quantum', 'Reboot', 'Math', 'Gym'].map((group, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{group}</span>
                    <button className="btn btn-outline btn-xs">Join</button>
                  </div>
                ))}
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
              className={`flex items-center justify-center w-12 h-12 rounded-full border ${isDarkMode ? 'border-gray-400 bg-gray-600' : 'border-gray-300 bg-gray-200'} cursor-pointer transition-all`}
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-yellow-400"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-gray-700"
                >
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

          <div className={`card ${isDarkMode ? 'bg-gray-800' : 'bg-base-100'} shadow-xl mb-4`}>
          <div className={`card-body ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              <h2 className="card-title">What's on your mind?</h2>
              <form onSubmit={handlePostSubmit}>
                <textarea 
                  className={`textarea textarea-bordered w-full ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900'}`} 
                  placeholder="Write something..."
                  value={postData.content}
                  onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <label className="btn btn-outline btn-sm">
                      <FaImage className="mr-2" />
                      Upload Image
                      <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </label>
                    {postData.image && <span className="text-success">Image uploaded</span>}
                  </div>
                  <select 
                    className={`select select-bordered select-sm ${isDarkMode ? 'bg-gray-700' : ''}`}
                    value={postData.privacy}
                    onChange={(e) => setPostData({ ...postData, privacy: e.target.value })}
                  >
                    <option value="public">Public</option>
                    <option value="almost private">Almost Private</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="card-actions justify-end mt-2">
                  <button type="submit" className="btn btn-primary">Post</button>
                </div>
              </form>
            </div>
          </div>

          {/* Display posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className={`card shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-base-100'}`}>
                <div className="card-body">
                  <div className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={post.avatar} alt={post.user} />
                      </div>
                    </div>
                    <span className="font-semibold">{post.user}</span>
                  </div>
                  <p>{post.content}</p>
                  {post.image && (
                    <div className="mt-2">
                      <img src={post.image} alt="Post image" className="w-full h-auto rounded" />
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Privacy: <span className={`badge ${post.privacy === 'public' ? 'badge-info' : post.privacy === 'almost private' ? 'badge-warning' : 'badge-error'}`}>{post.privacy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
