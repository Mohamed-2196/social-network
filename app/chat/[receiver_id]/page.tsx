"use client"
import React from 'react';
import Nav from "../../components/nav";
import ChatBox from '../../components/ChatBox';
import Chatpic from '../../components/chatpic';
import { useState , useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { join } from 'node:path';


interface ReceiverInformation {
    first_name: string;
    last_name: string;
    nickname: string;
    image: string | null; // Optional if the image can be null
  }

const page = () => {
    const searchParams = useSearchParams();
    const [receiverId, setReceiverId] = useState<string | null>(null); // State to store receiver_id
    const [receiverInfo, setReceiverInfo] = useState<ReceiverInformation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

      const serverUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/chat/info?receiver_id=${receiverId}`;

      useEffect(() => {
        const receiverIdFromUrl = searchParams.get('receiverId'); // Get the receiver_id from URL
        if (receiverIdFromUrl) {
          setReceiverId(receiverIdFromUrl); // Set the receiver_id if it exists
        }
      }, [searchParams]);
    
      useEffect(() => {
        if (receiverId) {
          fetchReceiverInfo();
        }
      }, [receiverId]);

      const fetchReceiverInfo = async () => {
        try {
          const response = await fetch(serverUrl, {
            method: "GET",
            credentials: "include",
          });
        //   const text = await response.text()
        //   console.log(text);
      
          if (!response.ok) {
            throw new Error("Failed to fetch receiver information.");
          }
      
          // Explicitly type the response data
          const data: ReceiverInformation  = await response.json();
      
          setReceiverInfo({
            first_name: data.first_name,
            last_name: data.last_name,
            nickname: data.nickname,
            image: data.image ? `${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/${data.image}` : null
          });
        } catch (err) {
          console.error(err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      


  return (
    <>
      <div>
        <Nav/>
      </div>

      <div className="flex w-full h-screen">
        {/* Left Section: 30% */}
        <div className="w-[30%] p-4 bg-gray-800">
          <div className='chatlist'>
            <div className="card bg-base-200 shadow-md mb-4">
              <div className="card-body p-4">
                <h2 className="card-title text-lg font-bold">Messages</h2>
              </div>
            </div>

            <ul className="menu menu-md bg-base-200 rounded-box w-[100%] h-200">
              <li><a>  lg item 1</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
      

        {/* Right Section: 70% */}
        <div className="w-[70%] bg-base-200 p-4 flex flex-col h-full">

        {receiverInfo ? (
            <>
              <div className="card bg-base-200 mb-4 border-2 border-gray-300 rounded-lg">
                <div className="card-body p-2">
                  <h2 className="card-title text-lg font-bold"> <Chatpic image={receiverInfo.image || null}/>{receiverInfo.first_name}</h2>
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
            </>
          ) : (
            <div>No receiver information available.</div> // Show message if receiverInfo is null
          )}
        </div>
      </div>
    </>
  );
};

export default page;
