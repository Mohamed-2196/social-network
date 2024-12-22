'use client';
import React, { useState } from 'react';
import Nav from "./nav";
import { FaImage } from 'react-icons/fa';

export default function HomePage() {
  const [posts, setPosts] = useState([
    { id: 1, user: 'Yousif', content: 'I am just a gay boy!', privacy: 'public', avatar: '' },
  ]);
  const [postData, setPostData] = useState({
    content: '',
    privacy: 'public',
    image: null,
  });

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostData({ ...postData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!postData.content.trim() && !postData.image) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('content', postData.content);
      formDataToSend.append('privacy', postData.privacy);
      if (postData.image) {
        formDataToSend.append('image', postData.image);
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
        image: postData.image,
      };

      setPosts([newPost, ...posts]);
      setPostData({ content: '', privacy: 'public', image: null });
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  return (
    <>
      <Nav />
      <div className="container mx-auto flex flex-col md:flex-row gap-4 p-4">
        <aside className="w-full md:w-1/4">
          <div className="card bg-base-100 shadow-xl">
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
        </aside>
        <main className="flex-grow">
          <div className="card bg-base-100 shadow-xl mb-4">
            <div className="card-body">
              <h2 className="card-title">What's on your mind?</h2>
              <form onSubmit={handlePostSubmit}>
                <textarea 
                  className="textarea textarea-bordered w-full" 
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
                    className="select select-bordered select-sm"
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
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={post.avatar} alt={post.user} />
                      </div>
                    </div>
                    <div>
                      <a href={`/profile/${post.user.toLowerCase()}`} className="font-bold link link-hover">{post.user}</a>
                      <p className="text-sm text-base-content text-opacity-60">{post.privacy}</p>
                    </div>
                  </div>
                  <p>{post.content}</p>
                  {post.image && <img src={post.image} alt="Post" className="rounded-lg mt-2" />}
                  <div className="card-actions justify-end">
                    <button className="btn btn-sm">Like</button>
                    <button className="btn btn-sm">Comment</button>
                    <button className="btn btn-sm">Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <aside className="w-full md:w-1/4">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Groups</h2>
              <div className="form-control">
                <input type="text" placeholder="Search groups" className="input input-bordered w-full max-w-xs" />
              </div>
              <div className="space-y-2 mt-2">
                {['Quantum', 'reboot', 'Math', 'Gym'].map((group, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{group}</span>
                    <button className="btn btn-outline btn-xs">Join</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
