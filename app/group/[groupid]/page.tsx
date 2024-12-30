"use client";
import React, { useState, useEffect,useCallback  } from "react";
import Nav from "../../components/nav";
import GroupPic from "../../components/groupPic";
import { useParams } from "next/navigation";
import Poll from "../../components/Poll";
import GroupPost from "../../components/groupPost";
import { useGlobalContext } from "../../components/GlobalContext";

export interface GroupChat {
  groupID: number;
  groupName: string;
  groupDescription: string;
  users: Member[];
}

export interface Member {
  user_id: number;
  admin: boolean;
  image: string;
  username: string;
  me: boolean;
}

export interface GroupMessage {
  sender_id: number;
  name: string;
  created_at: string;
  content: string;
  post_image: string;
  post_content: string;
  group_post_id: number;
}

export interface GroupPostFetch {
  group_post_id: number;
  group_id: number;
  user_id: number;
  content_text: string;
  content_image: string;
  created_at: string;
}

const GroupChatPage = () => {
  const [popUpIsVisible, setPopUpIsVisible] = useState(false);
  const { groupid } = useParams();
  const { subscribe } = useGlobalContext();
  const [showMessage, setShowMessage] = useState(true);
  const [showGroupPost, setShowGroupPost] = useState(false);
  const [groupChatInfo, setGroupChatInfo] = useState<GroupChat>();
  const [groupMessage, setGroupMessage] = useState<GroupMessage[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPostFetch[]>([]);
  const [messageSending, setMessageSending] = useState<{ message: string }>({ message: "" });
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const actualUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const serverUrl = `${actualUrl}/groupchat/${groupid}`;
  const serverUrl2 = `${actualUrl}/getGroupMessage/${groupid}`;

  const handleNewMessage = useCallback((data) => {
    console.log(data);
    if (data.type === "new_message") {
      setGroupMessage(prevMessages => [...prevMessages, data.messageClient]);
      setUpdateTrigger(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(handleNewMessage);
    return () => unsubscribe();
  }, [subscribe, handleNewMessage]);

  const fetchGroupPosts = useCallback(async () => {
    try {
      const response = await fetch(`${actualUrl}/getGroupPosts/${groupid}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GroupPostFetch[] = await response.json();
      setGroupPosts(data);
    } catch (error) {
      console.error("Error fetching group posts:", error);
    }
  }, [actualUrl, groupid]);

  useEffect(() => {
    fetchGroupPosts();
  }, [fetchGroupPosts]);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data: GroupChat = await response.json();
        setGroupChatInfo(data);
      } catch (err) {
        console.error(err, "occurred");
      }
    };

    const getGroupMessages = async () => {
      try {
        const response = await fetch(serverUrl2, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data: GroupMessage[] = await response.json();
        setGroupMessage(data);
      } catch (err) {
        console.error(err, "occurred");
      }
    };

    fetchGroupInfo();
    getGroupMessages();
  }, [serverUrl, serverUrl2]);

  const handleSendMessage = async () => {
    try {
      const sendingMessage = await fetch(`${actualUrl}/sendGroupMessage/${groupid}`, {
        method: "POST",
        body: JSON.stringify(messageSending),
        credentials: "include",
      });
      if (!sendingMessage.ok) {
        throw new Error("Failed to send message");
      }
      setGroupMessage(prevMessages => [...prevMessages, {
        sender_id: groupChatInfo?.users.find(u => u.me)?.user_id || 0,
        name: groupChatInfo?.users.find(u => u.me)?.username || "",
        created_at: new Date().toISOString(),
        content: messageSending.message,
        post_image: "",
        post_content: "",
        group_post_id: 0
      }]);
      setUpdateTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error sending message:", err);
    }
    setMessageSending({ message: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setMessageSending((prev) => ({ ...prev, [name]: value }));
  };

  const togglePopup = () => {
    setPopUpIsVisible(!popUpIsVisible);
  };

  const togglePostPopup = () => {
    setShowGroupPost(!showGroupPost);
  };

  return (
    <>
      <div>
        <Nav />
      </div>
      <div className="flex w-full h-screen">
        <div className="w-[30%] p-4 bg-gray-800">
          <div className="chatlist">
            <div className="card bg-base-200 shadow-md mb-4">
              <div className="card-body p-4">
                <h2 className="card-title text-lg font-bold">Members</h2>
              </div>
            </div>
            <ul className="menu menu-md bg-base-200 rounded-box w-[100%] h-200">
              {groupChatInfo?.users.map((user, index) => (
                <li key={`${user.user_id}-${index}`} className="w-[100%]">
                  <a className="w-full">
                    <div className="flex justify-between">
                      <div className="flex gap-3 items-center">
                        <GroupPic imgurl={`${actualUrl}/uploads/${user.image}`} />
                        {user.username}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="w-[70%] bg-base-200 p-4 flex flex-col h-full">
          <div className="card bg-base-200 mb-4 border-2 border-gray-300 rounded-lg">
            <div className="flex card-body p-2">
              <h2 className="card-title justify-between text-lg font-bold">
                {groupChatInfo?.groupName}
                {showMessage ? (
                  <button className="btn btn-outline btn-accent" onClick={() => setShowMessage(false)}>
                    Posts
                  </button>
                ) : (
                  <button className="btn btn-outline btn-accent" onClick={() => setShowMessage(true)}>
                    Messages
                  </button>
                )}
              </h2>
            </div>
          </div>
          {popUpIsVisible && (
            <div className="mb-4">
              <Poll />
            </div>
          )}
          {showMessage ? (
            <div className="flex-1 overflow-auto">
              {groupMessage && groupMessage.length > 0 ? (
                groupMessage.map((entry, index) => (
                  <div key={`${entry.group_post_id}-${index}`} className="chat chat-start">
                    <div className="chat-image avatar">
                      <div className="w-10 rounded-full">
                        <img
                          src={`${actualUrl}/uploads/${entry.post_image}`}
                          alt="User avatar"
                          width={40}
                          height={40}
                        />
                      </div>
                    </div>
                    <div className="chat-header">
                      {entry.name}
                      <time className="text-xs opacity-50">{entry.created_at}</time>
                    </div>
                    <div className="chat-bubble flex">
                      {entry.group_post_id ? (
                        <>
                          <div>{entry.post_content}</div>
                          <img
                            src={`${actualUrl}/uploads/${entry.post_image}`}
                            alt="Post"
                            width={100}
                            height={100}
                          />
                        </>
                      ) : (
                        <div>{entry.content}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div>No messages available.</div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {groupPosts && groupPosts.length > 0 ? (
                groupPosts.map((post, index) => (
                  <div key={`${post.group_post_id}-${index}`}>{post.content_text}</div>
                ))
              ) : (
                <div>No posts available.</div>
              )}
            </div>
          )}
          <div className="fixed bottom-0 right-0 w-[70%] p-4 bg-gray-800 text-white mt-auto">
            <div className="flex items-center space-x-4">
              <button onClick={togglePopup} className="btn btn-outline">
                Poll
              </button>
              <button onClick={togglePostPopup} className="btn btn-outline">
                Post
              </button>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Type something..."
                name="message"
                value={messageSending.message}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              {showGroupPost && (
                <div className="mb-4">
                  <GroupPost groupID={groupid} />
                </div>
              )}
              <button className="btn btn-outline" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupChatPage;
           