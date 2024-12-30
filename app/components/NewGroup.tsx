"use client";
import React, { useState, useEffect } from "react";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

function NewGroup({
  onSubmit,
  onClose,
}: {
  onSubmit: (selectedUsers: string[], selectedIDs: string[]) => void;
  onClose: () => void;
}) {
  const [checkedUsers, setCheckedUsers] = useState<string[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const usersURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/notificationnum`; // Update to fetch users

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    uid: string
  ) => {
    const { value, checked } = event.target;
    setCheckedUsers((prev) =>
      checked ? [...prev, value] : prev.filter((user) => user !== value)
    );

    setUserIDs((before) =>
      checked ? [...before, uid] : before.filter((id) => id !== uid)
    );
  };

  const handleSubmit = () => {
    onSubmit(checkedUsers, userIDs);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(usersURL, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.users); // Assuming the API returns { users: Array<User> }
      } catch (err) {
        console.error(err, "occurred");
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (users) { // Check if users is not null
      const results = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results.slice(0, 8)); // Show only maximum 8 users
    }
  }, [searchTerm, users]);

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
      <input
        type="text"
        placeholder="Search users..."
        className="input w-11/12 m-2"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredUsers.length > 0 && (
        <>
          {filteredUsers.map((user) => (
            <div
              key={user.id} // Use user.id for unique keys
              className="flex items-center shadow-md w-11/12 justify-between min-h-19 border-solid border-blue-200 border-2"
            >
              <div className="flex items-center ml-2 gap-10">
                <div className="avatar">
                  <div className="w-14 rounded-full">
                    <img
                      src={`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/${user.avatar}`}
                      alt={`${user.first_name} ${user.last_name}`}
                    />
                  </div>
                </div>
                <h1 className="text-base">{`${user.first_name} ${user.last_name}`}</h1>
              </div>
              <input
                type="checkbox"
                className="form-checkbox mr-4"
                value={`${user.first_name} ${user.last_name}`} // Use full name as value
                onChange={(e) => handleCheckboxChange(e, user.id)} // Pass user.id
              />
            </div>
          ))}
        </>
      )}

      {checkedUsers.length > 0 ? (
        <>
          <button
            className="btn btn-md btn-primary mt-4"
            onClick={handleSubmit}
          >
            Submit
          </button>
          <br />
        </>
      ) : (
        <br />
      )}
    </div>
  );
}

export default NewGroup;