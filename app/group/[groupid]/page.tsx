"use client";
import React, { useState, useEffect, useCallback } from "react";
import Nav from "../../components/nav";
import GroupPic from "../../components/groupPic";
import UserInvitePopup from "../../components/userinvite";
import { useParams, useRouter } from "next/navigation";
import GroupPost from "../../components/groupPost";
import { useGlobalContext } from "../../components/GlobalContext";
import { FaComment } from "react-icons/fa";

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
  Poll_id : number;
  poll_title: string;
  poll_description: string;
  poll_options: PollOption[];
}

export interface PollOption {
  poll_id : number ;
  option_id: number;
  content: string;
  //add votes later
}

export interface GroupPostFetch {
  id: number;
  group_id: number;
  user_id: number;
  content_text: string;
  content_image: string;
  created_at: string;
}

const GroupChatPage = () => {
  const [popUpIsVisible, setPopUpIsVisible] = useState(false);
  const { groupid } = useParams<{ groupid: string }>();
  const { subscribe } = useGlobalContext();
  const [showMessage, setShowMessage] = useState(true);
  const [showGroupPost, setShowGroupPost] = useState(false);
  const [groupChatInfo, setGroupChatInfo] = useState<GroupChat>();
  const [groupMessage, setGroupMessage] = useState<GroupMessage[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPostFetch[]>([]);
  const [messageSending, setMessageSending] = useState<{ message: string }>({ message: "" });
  const actualUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const serverUrl = `${actualUrl}/groupchat/${groupid}`;
  const serverUrl2 = `${actualUrl}/getGroupMessage/${groupid}`;
  const router = useRouter();
  const [createOption, setCreateOption] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [item, setItem] = useState('');
  const [showList, setShowList] = useState(false);
  const [pollSending, setPollSending] = useState<{
    pollTopic: string;
    pollDescription: string;
    pollOptions: string[];
  }>({
    pollTopic: "",
    pollDescription: "",
    pollOptions: [],
  });

  const handleClick = () => {
    setCreateOption(!createOption);
    setShowList(false);
    if (item && !options.includes(item)) {
      setOptions((prevItems) => [...prevItems, item]);
      setItem("");
      setShowList(true);
      setCreateOption(true);
    }
  };

  const handleInputChangee = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPollSending((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItem(e.target.value);
  };

  const handleNewMessage = useCallback((data: any) => {
    if (data.type === "new_message") {
      if (data.messageClient.group_id == groupid) {
        setGroupMessage((prevMessages) => [...(prevMessages || []), data.messageClient]);
      }
    } else if (data.type == "new_post") {
      if (data.postMessage.group_id == groupid) {
        setGroupPosts((prevPosts) => [...(prevPosts || []), data.postMessage]);
      }
    }
  }, [groupid]);

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

  const handleSendPoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pollTopic = formData.get('pollTopic') as string || '';
    const pollDescription = formData.get('pollDescription') as string;
    const pollData = {
      pollTopic,
      pollDescription,
      pollOptions: options,
    };
    setPollSending(pollData);

    try {
      const data = await fetch(`${actualUrl}/sendGroupPoll/${groupid}`, {
        method: "POST",
        body: JSON.stringify(pollData),
        credentials: "include"
      });
      if (!data.ok) {
        throw new Error("Failed to send poll");
      }
    } catch (err) {
      console.error("Error sending poll data", err);
    }
    setPollSending({ pollTopic: "", pollDescription: "", pollOptions: [] });
    setOptions([]);
    setPopUpIsVisible(false);
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
              <UserInvitePopup groupId={groupid}/>
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
              <form onSubmit={handleSendPoll} className="w-64 h-full text-white flex-col items-center justify-center rounded-lg shadow-lg p-4">
                <div>
                  <input type="text" name="pollTopic" placeholder="Title" className="input input-bordered input-secondary h-8 w-66 max-w-xs text-black mb-2" onChange={handleInputChangee}/>
                  <input type="text" name="pollDescription" placeholder="Description" className="input input-bordered input-secondary h-10 w-66 max-w-xs text-black" onChange={handleInputChangee}/>
                </div>
                <div className="flex items-center mt-2 mb-2">
                  <div className="text-black font-bold mr-2">Create an option</div>
                  <button type="button" onClick={handleClick} className="btn btn-xs">+</button>
                </div>
                {showList && (
                  <div className="text-black mt-2">
                    <ol>
                      {options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {createOption && (
                  <div className="flex items-center mt-2">
                    <input type="text" value={item} onChange={handleOptionChange} placeholder="Type here" className="input input-bordered w-40 h-6 max-w-xs text-black mr-2" />
                    <button type="button" onClick={handleClick} className="btn btn-xs">+</button>
                  </div>
                )}
                <div className="flex justify-center w-full mt-4">
                  <button type="submit" className="btn btn-active w-full max-w-xs">Submit</button>
                </div>
              </form>
            </div>
          )}
          {showMessage ? (
            <div className="flex-1 overflow-auto mb-16">
             {groupMessage && groupMessage.length > 0 ? (
  groupMessage.map((entry, index) => (
    <div key={`${entry.group_post_id}-${index}`} className="mb-4">
      <div className="chat chat-start">
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img
              src={`${actualUrl}/uploads/${entry.author_image}`}
              alt="User avatar"
              width={40}
              height={40}
            />
          </div>
        </div>
        <div className="chat-header">
          {entry.name}
          <time className="text-xs opacity-50 ml-2">{entry.created_at}</time>
        </div>
        <div className="chat-bubble">
          {entry.Poll_id ? (
            <div className="bg-white pt-1 pl-6 pr-6 rounded-lg shadow-lg max-w-md mx-auto h-[200px] w-50">
            <h2 className="text-2xl font-bold mb-0">{entry.poll_title}</h2>
            <p className="mb-0">{entry.poll_description}</p>
            
            <form id="pollForm" className="flex flex-col justify-end">
           <div className="space-y-2 mb-2">
            {entry.poll_options.map((option) => (
               <label key={option.option_id} className="flex items-center text-sm">
                <input 
              type="radio" 
              name="poll" 
              value={option.option_id.toString()} 
              className="radio radio-primary radio-sm" 
            />
            <span className="ml-2">{option.content}</span>
            <span className="ml-auto hidden percentage text-xs">0%</span>
          </label>
            ))}
    </div>
    
    <button type="submit" className="btn btn-primary btn-sm">Submit</button>
  </form>
          </div>
          
          ) : (
            <div>{entry.content}</div>
          )}
        </div>
      </div>
    </div>
  ))
) : (
  <div>No messages available.</div>
)}
            </div>
          ) : (
            <div className="flex-1 overflow-auto mb-16">
              {groupPosts && groupPosts.length > 0 ? (
                groupPosts.map((post) => (
                  <div
                    key={post.id}
                    className="card shadow-xl bg-base-100"
                    onClick={() => router.push(`/group/post/${post.id}`)}
                  >
                    <div className="card-body">
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-10 rounded-full">
                            <img
                              src={`${actualUrl}/uploads/${post.author_image}`}
                              alt={post.author_name}
                            />
                          </div>
                        </div>
                        <a
                          href={`/profilepage/${post.author_id}`}
                          className="font-semibold link link-hover"
                        >
                          {post.author_name}
                        </a>
                      </div>
                      <p>{post.content_text}</p>
                      {post.content_image && (
                        <div className="mt-2">
                          <img
                            src={`${actualUrl}/uploads/${post.content_image}`}
                            alt="Post image"
                            className="w-full h-auto max-w-[600px] max-h-[400px] rounded"
                          />
                        </div>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        <button className="btn btn-ghost btn-sm">
                          <FaComment />
                        </button>
                      </div>
                    </div>
                  </div>
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
           