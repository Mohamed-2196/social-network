import React from 'react';
import { FaHeart, FaComment, FaImage } from 'react-icons/fa';

const Post = ({ id, image, content, likes, comments }) => {
  const imageBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/uploads/";
  const isValidImage = image && image !== imageBaseUrl && image !== (imageBaseUrl);

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
          <button className="flex items-center space-x-1 hover:text-red-500 transition duration-300">
            <FaHeart className="text-xl" />
            <span className="font-semibold">{likes}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-purple-600 transition duration-300">
            <FaComment className="text-xl" />
            <span className="font-semibold">{comments}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;
