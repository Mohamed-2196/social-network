import React, { useState } from 'react';
import { FaHeart, FaComment } from 'react-icons/fa';

const Post = ({ id, image, content, likeCount, userLiked }) => {
  const imageBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/uploads/";
  const isValidImage = image && image !== imageBaseUrl;

  // State to track if the post is liked and the likes count
  const [isLiked, setIsLiked] = useState(userLiked);
  const [likes, setLikes] = useState(likeCount || 0);

  const handleLikeToggle = async () => {
    // Toggle the like state
    setIsLiked((prev) => !prev);
    // Update likes count based on the new state
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));

    // Create the payload for the request
    const payload = {
      postId: id,
      like: !isLiked, // Send the opposite of the current state
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/likepost`, {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      // Optionally, update the likes count based on the like status
      const data = await response.json();
      // You could update likes from the response if needed
      // setLikes(data.likes); // Uncomment if you want to update likes from the response
    } catch (error) {
      console.error('Error liking post:', error);
      // Optionally revert the like state if the request fails
      setIsLiked((prev) => !prev);
      // Revert the likes count on error
      setLikes((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <div key={id} className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
      {isValidImage && (
        <div className="w-full h-64">
          <img src={image} alt={`Post ${id}`} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <p className={`text-gray-800 mb-4 text-lg ${isValidImage ? 'line-clamp-3' : 'line-clamp-6'}`}>{content}</p>
        <div className="flex justify-between items-center text-gray-600">
          <button
            className={`flex items-center space-x-1 transition duration-300 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            onClick={handleLikeToggle}
          >
            <FaHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-semibold">{likes}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-purple-600 transition duration-300">
            <FaComment className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;