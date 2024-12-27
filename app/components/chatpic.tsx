import React from 'react'


interface ChatpicProps {
  image: string | null; // Image can be a string or null
}

const Chatpic: React.FC<ChatpicProps> = ({ image }) => {
  const defaultImage = "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";
  return (
    <div>
      <div className="avatar">
    <div className="w-14 rounded-full">
    <img src={image || defaultImage} />
    </div>
   </div>
    </div>
  )
}

export default Chatpic