"use client";
import React, { useState, useEffect } from "react";

export interface Mutual {
  userid: number;
  name: string;
}

function NewGroup({
  onSubmit,
  onClose,
}: {
  onSubmit: (selectedUsers: string[]) => void;
  onClose: () => void;
}) {
  const [checkedUsers, setCheckedUsers] = useState<string[]>([]);
  const [mutuals, setMutuals] = useState<Mutual[]>([]);

  const mutualURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/mutuals`;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setCheckedUsers((prev) =>
      checked ? [...prev, value] : prev.filter((user) => user !== value)
    );
  };

  const handleSubmit = () => {
    onSubmit(checkedUsers);
  };

  useEffect(() => {
    const fetchMutuals = async () => {
      try {
        const response = await fetch(mutualURL, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data: Mutual[] = await response.json();
        setMutuals(data);
      } catch (err) {
        console.error(err, "occured");
      }
    };

    fetchMutuals();
  }, []);

  return (
    <div className="flex gap-2 items-center flex-col fixed top-32 right-32 h-11/12 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
      <div className="flex w-full justify-between m-2">
        <h1 className="text-2xl m-1">Pick People</h1>
        <button
          className="btn btn-md btn-outline mr-3 btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {mutuals.map((user) => (
        <div
          key={user.name}
          className="flex items-center shadow-md w-11/12 justify-between min-h-19 border-solid border-blue-200 border-2"
        >
          <div className="flex items-center ml-2 gap-10">
            <div className="avatar">
              <div className="w-14 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <h1 className="text-base">User {user.name}</h1>
          </div>
          <input
            type="checkbox"
            className="form-checkbox mr-4"
            value={String(user.name)}
            onChange={handleCheckboxChange}
          />
        </div>
      ))}
      {checkedUsers.length > 0 ? (
        <>
          <button
            className="btn btn-md btn-primary mt-4"
            onClick={handleSubmit}
          >
            Submit
          </button>{" "}
          <br></br>
        </>
      ) : (
        <br></br>
      )}
    </div>
  );
}

export default NewGroup;
