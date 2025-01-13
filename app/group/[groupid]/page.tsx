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
  votes_count : number;
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
  const [pollerr, setPollerr] = useState("");
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
    } else if (data.type === "new_post") {
      if (data.postMessage.group_id == groupid) {
        setGroupPosts((prevPosts) => [...(prevPosts || []), data.postMessage]);
      }
    } else if (data.type === "update_poll") {
      console.log(data.messageClient)
      // Update the existing poll with the new information
      setGroupMessage((prevMessages) => {
        return (prevMessages || []).map((message) => {
          if (message.Poll_id === data.messageClient.Poll_id) {  // Match by unique poll ID
            return {
              ...data.messageClient,  // Replace with the new poll data
            };
          }
          return message;  // Return the existing message if not updating
        });
      });
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
          setGroupMessage(data); // Assuming this updates your state
  
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
    if (pollData.pollOptions.length < 2 ) {
      setPollerr("Please create at least two options for the poll.");
      return;
    }
    if (pollData.pollOptions.length > 9 ) {
      setPollerr("Please create less than nine options for the poll.");
      return;
    }
    if (pollData.pollDescription == "" || pollData.pollDescription== "" ) {
      setPollerr("Please write a title and a description.");
      return;
    }
    setPollerr("");
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
    setOptions([]);
    setPopUpIsVisible(false);
  };

  const handleSendVotes = async (e: React.FormEvent<HTMLFormElement>, entry: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const option_id = formData.get('poll');
    const voteData = {
      option_id ,
    }
  if (!option_id) {
    alert("Please select an option before submitting.");
    return;
  }

  const pollID = entry.Poll_id;
  try {
    const data = await fetch(`${actualUrl}/sendPollVote/${pollID}`, {
      method: "POST",
      body: JSON.stringify(voteData),
      credentials: "include"
    });
    if (!data.ok) {
      throw new Error("Failed to send poll");
    }
  } catch (err) {
    console.error("Error sending poll data", err);
  }
  }

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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-96 max-w-full relative">
      <button 
      onClick={togglePopup}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <form onSubmit={handleSendPoll} className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Create a Poll </h2>
        {pollerr && (
          <div className="text-red-500 text-sm">{pollerr}</div>
        )

        }
        <div className="space-y-3">
          <input
            type="text"
            name="pollTopic"
            placeholder="Poll Title"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            name="pollDescription"
            placeholder="Poll Description"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Poll Options</span>
          <button
            type="button"
            onClick={handleClick}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
          >
            Add Option
          </button>
        </div>

        {showList && (
          <ul className="list-decimal pl-5 space-y-1">
            {options.map((option, index) => (
              <li key={index} className="text-white">{option}</li>
            ))}
          </ul>
        )}

        {createOption && (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={item}
              onChange={handleOptionChange}
              placeholder="Enter option"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleClick}
              className="px-3 py-2 bg-blue-500 text-white rounded-md transition duration-300"
            >
              Add
            </button>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
        >
          Create Poll
        </button>
      </form>
    </div>
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
    <div className="min-w-[200px] min-h-[150px] mb-3">
      <h4 className="text-base font-semibold mb-1 text-white truncate">{entry.poll_title}</h4>
      <p className="text-xs mb-2 text-gray-300 line-clamp-2">{entry.poll_description}</p>
      
      <form id="pollForm" className="space-y-2" onSubmit={(e) => handleSendVotes(e, entry)}>
        <div className="space-y-1">
          {entry.poll_options.map((option) => (
            <label key={option.option_id} className="flex items-center text-xs bg-slate-600 p-1.5 rounded-md hover:bg-slate-500 transition-colors">
              <input 
                type="radio" 
                name="poll" 
                value={option.option_id.toString()} 
                className="form-radio h-3 w-3 text-blue-400 focus:ring-blue-400 border-gray-500"
              />
              <span className="ml-2 text-white flex-grow truncate">{option.content}</span>
              <span className="ml-auto text-[10px] bg-blue-400 text-white px-1 py-0.5 rounded-full">{option.votes_count}</span>
            </label>
          ))}
        </div>
      
        <button 
          type="submit" 
          className="w-full mb-2 py-1 text-xs bg-blue-400 text-white rounded-md hover:bg-blue-500 transition duration-300"
        >
          Vote
        </button>
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
           