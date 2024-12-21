"use client";
import React from "react";

function MakeGroup({
  selectedUsers,
  onClose,
}: {
  selectedUsers: string[];
  onClose: () => void;
}) {
  return (
    <div className="flex gap-2 items-center flex-col fixed right-32 h-11/12 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
      <div className="flex w-full justify-between m-2">
        <h1 className="text-2xl m-1">Create Group</h1>
        <button
          className="btn btn-md btn-outline mr-3 btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <form className="w-full" action="">
        <div className="flex flex-col items-center">
          <p>Group Title</p>
          <input
            className="w-11/12"
            type="text"
            name="group-title"
            placeholder="Title"
            required
          />
        </div>
        <div className="flex flex-col items-center">
          <p>Group Description</p>
          <input
            className="w-11/12"
            type="text"
            name="group-desc"
            placeholder="Description"
            required
          />
        </div>
        <div className="flex flex-col items-center mt-4">
          <p>Selected Users</p>
          <ul>
            {selectedUsers.map((user) => (
              <li key={user}>User ID: {user}</li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}

export default MakeGroup;
