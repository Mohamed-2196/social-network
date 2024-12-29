"use client";
import React from "react";
import Nav from "../../components/nav";
import GroupPic from "../../components/groupPic";
import { useParams } from "next/navigation";
import Poll from "../../components/Poll";
import GroupPost from "../../components/groupPost";
import { useState, useEffect } from "react";
import { useGlobalContext } from "../../components/GlobalContext";

export interface GroupChat {
  groupID: number;
  groupName: string;
  groupDescription: string;
  groupType: boolean;
  users: Member[];
}

export interface Member {
  user_id: number;
  admin: boolean;
  username: string;
  me: boolean;
}

export interface GroupMessage {
  sender_id: number;
  name: string;
  created_at: string;
  content: string;
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
  // const [allMessages, setAllMessages] = useState("")
  // const [msg, setMsg] = useState("");
  const { subscribe } = useGlobalContext();
  const [showMessage, setShowMessage] = useState(true);
  const [showGroupPost, setShowGroupPost] = useState(false);
  const [groupChatInfo, setGroupChatInfo] = useState<GroupChat>();
  const [groupMessage, setGroupMessage] = useState<GroupMessage[]>([]);
  const [groupPosts, setGroupPosts] = useState<GroupPostFetch[]>([]);

  // const router = useRouter();
  const [messageSending, setMessageSending] = useState<{
    message: string;
  }>({
    message: "",
  });

  const togglePopup = () => {
    setPopUpIsVisible(!popUpIsVisible);
  };

  const togglePostPopup = () => {
    setShowGroupPost(!showGroupPost);
  };

  const actualUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const serverUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/groupchat/${groupid}`;
  const serverUrl2 = `${process.env.NEXT_PUBLIC_SERVER_URL}/getGroupMessage/${groupid}`;

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      console.log("Anything?", data);
      if (data.type === "messagesToClient") {
        console.log(data.messageClient, "WHAT AM I");
        setGroupMessage(data.messageClient);
      } else if (data.type === "groupActive") {
        fetchGroupPosts();
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const fetchGroupPosts = async () => {
    try {
      const response = await fetch(`${actualUrl}/getGroupPosts`, {
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
  };
  useEffect(() => {
    fetchGroupPosts();
  }, []);

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
        console.error(err, "occured");
      }
    };
    fetchGroupInfo();

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
        console.error(err, "occured");
      }
    };
    getGroupMessages();
  }, []);

  useEffect(() => {
    console.log(groupMessage, "XX");
  }, [groupMessage]);

  const handleSendMessage = async () => {
    try {
      const sendingMessage = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/sendGroupMessage/${groupid}`,
        {
          method: "POST",
          body: JSON.stringify(messageSending),
          credentials: "include",
        }
      );
      if (!sendingMessage.ok) {
        throw new Error("Failed to send message");
      }
      const responseData: GroupMessage[] = await sendingMessage.json();
      setGroupMessage(responseData);
      console.log(responseData, "FIRST");
    } catch (err) {
      console.error("Error sending message:", err);
    }
    setMessageSending({ message: "" });
  };

  // console.log(groupChatInfo);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setMessageSending((prev) => ({ ...prev, [name]: value }));

    // console.log(messageSending, "XX");
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
              {groupChatInfo?.users.map((user) => (
                <>
                  <li className="w-[100%]">
                    <a className="w-full">
                      <div className="flex w- justify-between">
                        {" "}
                        <div className="flex gap-3 items-center">
                          <GroupPic />
                          {user.username}
                        </div>
                      </div>
                    </a>
                  </li>
                </>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}

        {/* Right Section: 70% */}
        <div className="w-[70%] bg-base-200 p-4 flex flex-col h-full">
          <div className="card bg-base-200 mb-4 border-2 border-gray-300 rounded-lg">
            <div className="flex card-body p-2">
              <h2 className="card-title justify-between text-lg font-bold">
                {groupChatInfo?.groupName}
                {showMessage ? (
                  <button
                    className="btn btn-outline btn-accent"
                    onClick={() => setShowMessage(false)}
                  >
                    Posts
                  </button>
                ) : (
                  <button
                    className="btn btn-outline btn-accent"
                    onClick={() => setShowMessage(true)}
                  >
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
            <>
              {" "}
              <div className="flex-1 overflow-aut">
                {/* <GroupBox /> */}
                {groupMessage?.map((entry) => (
                  <>
                    <div className="chat chat-start">
                      <div className="chat-image avatar">
                        <div className="w-10 rounded-full">
                          <img
                            alt="Tailwind CSS chat bubble component"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                          />
                        </div>
                      </div>
                      <div className="chat-header">
                        {entry.name}
                        <time className="text-xs opacity-50">
                          {entry.created_at}
                        </time>
                      </div>
                      <div className="chat-bubble">{entry.content}</div>
                    </div>
                  </>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-aut">
              {groupPosts.map((post) => (
                <>
                  <div>{post.content_text}</div>
                </>
              ))}
            </div>
          )}

          {/* Typing Component */}
          <div className="fixed bottom-0 right-0 w-[70%] p-4 bg-gray-800 text-white mt-auto">
            <div className="flex items-center space-x-4">
              <button onClick={togglePopup} className="btn btn-outline">
                poll
              </button>
              <button onClick={togglePostPopup} className="btn btn-outline">
                Post
              </button>

              <input
                type="text"
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Type something..."
                name="message" // Ensure this matches the key in messageSending
                value={messageSending.message} // Bind the input to the correct state
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
