import React from 'react'

export const Loading = () => {
  return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 to-blue-600">
          <div className="p-8 bg-white bg-opacity-20 rounded-full backdrop-blur-lg">
            <div className="w-16 h-16 border-4 border-white border-dashed rounded-full animate-spin"></div>
          </div>
        </div>
      );  
}
