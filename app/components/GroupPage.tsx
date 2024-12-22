'use client';
import React, { useState } from "react";
import Nav from "../components/nav";
import NewGroup from "../components/NewGroup";
import MakeGroup from "../components/MakeGroup";

const GroupPage = () => {
  const [newGroupPopup, setNewGroupPopup] = useState(false); 
  const [makeGroupPopup, setMakeGroupPopup] = useState(false); 
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  

  const handleUserSelection = (users: string[]) => {
    setSelectedUsers(users); 
    setNewGroupPopup(false); 
    setMakeGroupPopup(true); 
  };

  return (
    <div className="flex flex-col gap-2 min-h-screen bg-base-200">
      <Nav />

      <div className="flex items-center justify-between min-h-20 border-2">
        <div className="flex gap-7 ml-3">
          <button className="btn btn-md btn-outline">My Groups</button>
          <button className="btn btn-md btn-outline btn-primary">
            All Groups
          </button>
        </div>
        <div>
          <button
            className="btn btn-md btn-outline btn-primary"
            onClick={() => setNewGroupPopup(true)} 
          >
            + New Group
          </button>
        </div>
      </div>

      <div className="flex items-center shadow-md justify-between min-h-19 border-solid border-blue-200 border-2">
        <div className="flex items-center ml-2 gap-10">
          <div className="avatar">
            <div className="w-14 rounded-full">
              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
            </div>
          </div>
          <h1 className="text-3xl">Group 1</h1>
        </div>
        <div className="flex items-center mr-2 gap-10">
          <button className="btn btn-outline btn-primary">
            Request To Join
          </button>
        </div>
      </div>
      <div className="flex items-center shadow-md justify-between min-h-19 border-solid border-blue-200 border-2">
        <div className="flex items-center ml-2 gap-10">
          <div className="avatar">
            <div className="w-14 rounded-full">
              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
            </div>
          </div>
          <h1 className="text-3xl">Group 2</h1>
        </div>
        <div className="flex items-center mr-2 gap-10">
          <button className="btn btn-outline btn-primary">
            Request To Join
          </button>
        </div>
      </div>


      {newGroupPopup && (
        <NewGroup
          onSubmit={handleUserSelection}
          onClose={() => setNewGroupPopup(false)} 
        />
      )}


      {makeGroupPopup && (
        <MakeGroup
          selectedUsers={selectedUsers} 
          onClose={() => setMakeGroupPopup(false)} 
        />
      )}
    </div>
  );
};

export default GroupPage;
