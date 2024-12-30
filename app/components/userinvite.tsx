import React, { useState, useEffect } from "react";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

function UserInvitePopup({ groupId, onInviteSuccess, onClose }: { groupId: string; onInviteSuccess: () => void; onClose: () => void; }) {
  const [checkedUsers, setCheckedUsers] = useState<string[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const usersURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/inviteableusers/${groupId}`;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>, uid: string) => {
    const { checked } = event.target;
    setCheckedUsers((prev) => {
      if (checked) {
        return [...prev, uid];
      } else {
        return prev.filter((userId) => userId !== uid);
      }
    });
    setUserIDs((prev) => {
      if (checked) {
        return [...prev, uid];
      } else {
        return prev.filter((id) => id !== uid);
      }
    });
  };

  const handleSubmit = async () => {
    if (userIDs.length === 0) {
      console.error("No users selected for invitation.");
      return; // Prevent submission if no users are selected
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/invite/${groupId}`, {
        method: "POST",
        body: JSON.stringify({ userIDs }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Response error:", errorData);
        throw new Error(errorData.message);
      }

      const data = await response.json();
      console.log("Invite sent successfully:", data);
      setIsPopupOpen(false);
      setUserIDs([]); // Clear userIDs after successful invite
      setCheckedUsers([]); // Clear checked users
      onInviteSuccess(); // Call success callback
    } catch (error) {
      console.error("Network Error:", error);
    }
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
        setUsers(data); // Assuming the API returns users directly
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [usersURL]);

  useEffect(() => {
    if (users) { // Check if users is not null or undefined
      const results = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results.slice(0, 8)); // Show only maximum 8 users
    }
  }, [searchTerm, users]);

  return (
    <div>
      <button onClick={() => setIsPopupOpen(true)} className="btn btn-neutral w-full">Invite Users</button>
      {isPopupOpen && (
        <div className="flex gap-2 items-center flex-col fixed top-32 z-10 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
          <div className="flex w-full justify-between m-2">
            <h1 className="text-2xl m-1">Pick People</h1>
            <button className="btn btn-md btn-outline mr-3 btn-primary" onClick={() => setIsPopupOpen(false)}>Close</button>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            className="input w-11/12 m-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredUsers.length > 0 && filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center shadow-md w-11/12 justify-between min-h-19 border-solid border-blue-200 border-2">
              <div className="flex items-center ml-2 gap-10">
                <div className="avatar">
                  <div className="w-14 rounded-full">
                    <img src={`${process.env.NEXT_PUBLIC_SERVER_URL}/uploads/${user.avatar}`} alt={`${user.first_name} ${user.last_name}`} />
                  </div>
                </div>
                <h1 className="text-base">{`${user.first_name} ${user.last_name}`}</h1>
              </div>
              <input
                type="checkbox"
                className="form-checkbox mr-4"
                value={user.id} // Use user id here
                checked={checkedUsers.includes(user.id)} // Control checkbox state
                onChange={(e) => handleCheckboxChange(e, user.id)}
              />
            </div>
          ))}
          {userIDs.length > 0 && (
            <button className="btn btn-md btn-primary mt-4" onClick={handleSubmit}>
              Send Invite
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UserInvitePopup;