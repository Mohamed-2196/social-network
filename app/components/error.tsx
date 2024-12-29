import React from 'react';

const Bug = ({ message }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-400 to-pink-500">
      <div className="p-8 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default Bug; // Corrected to default export