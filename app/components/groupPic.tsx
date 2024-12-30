import React from 'react'

const GroupPic = ({imgurl}) => {
  return (
    <div>
    <div className="avatar">
  <div className="w-14 rounded-full">
  <img src= {imgurl} />
  </div>
 </div>
  </div>
  )
}

export default GroupPic
