import React from "react";
import Nav from "../../components/nav";
import ChatBox from "../../components/ChatBox";
import Chatpic from "../../components/chatpic";
import { useParams } from "next/navigation";

const page = () => {
  const { groupid } = useParams();
  // const router = useRouter();

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
              <li>
                <a>
                  {" "}
                  <Chatpic /> lg item 1
                </a>
              </li>
              <li>
                <a>
                  {" "}
                  <Chatpic /> lg item 1
                </a>
              </li>
              <li>
                <a>
                  {" "}
                  <Chatpic /> lg item 1
                </a>
              </li>
              <li>
                <a>
                  {" "}
                  <Chatpic /> lg item 1
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}

        {/* Right Section: 70% */}
        <div className="w-[70%] bg-base-200 p-4 flex flex-col h-full">
          <div className="card bg-base-200 mb-4 border-2 border-gray-300 rounded-lg">
            <div className="card-body p-2">
              <h2 className="card-title text-lg font-bold">Group Name</h2>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <ChatBox />
          </div>

          {/* Typing Component */}
          <div className="fixed bottom-0 right-0 w-[70%] p-4 bg-gray-800 text-white mt-auto">
            <div className="flex items-center space-x-4">
              <button className="btn btn-outline">Send</button>
              <input
                type="text"
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="Type something..."
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
