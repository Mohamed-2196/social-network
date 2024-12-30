"use client";
import React from "react";
import { useState } from "react";
import { FaImage } from "react-icons/fa";

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

interface GroupPostProps {
  groupID: string;
}



const GroupPost: React.FC<GroupPostProps> = ({ groupID }) => {
  const [postData, setPostData] = useState({
    groupid: groupID,
    content: "",
    image: null,
  });


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostData({ ...postData, image: file });
    }
  };

  

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!postData.content.trim() && !postData.image) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("content", postData.content);
      formDataToSend.append("groupid", postData.groupid);
      if (postData.image) {
        formDataToSend.append("image", postData.image);
      }

      const response = await fetch(`${serverUrl}/createGroupPost/${groupID}`, {
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
      setPostData({ groupid: groupID, content: "", image: null });
      //   fetchPosts();
    } catch (error) {
      console.error("Error submitting post:", error);
    }
  };

  //   useEffect(() => {
  //     console.log(postData, "Meow Meow");
  //   }, [postData]);

  return (
    <div className="flex gap-2 items-center flex-col fixed bottom-44 left-2/4 h-11/12 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
      <form
        className="w-full text-md text-black flex flex-col gap-2 items-center"
        onSubmit={handlePostSubmit}
      >
        <div className="flex flex-col w-11/12 items-center">
          <p>Content</p>
          <textarea
            className="w-11/12 min-h-28 max-h-52"
            name="groupPostContent"
            value={postData.content}
            placeholder="Content"
            onChange={(e) =>
              setPostData({ ...postData, content: e.target.value })
            }
            required
          />
        </div>
        <label className="btn btn-outline btn-sm w-11/12">
          <FaImage className="mr-2" />
          Upload Image
          <input
            type="file"
            className="hidden"
            onChange={handleImageUpload}
            accept="image/*"
          />
        </label>
        {postData.image && <span className="text-success">Image uploaded</span>}
        <button
          type="submit"
          className="btn btn-outline w-11/12 mb-2 btn-secondary"
        >
          Make Group!
        </button>
      </form>
    </div>
  );
};

export default GroupPost;
