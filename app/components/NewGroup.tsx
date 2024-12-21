"use client";
import React, { useState } from "react";

function NewGroup({
  onSubmit,
  onClose,
}: {
  onSubmit: (selectedUsers: string[]) => void;
  onClose: () => void;
}) {
  const [checkedUsers, setCheckedUsers] = useState<string[]>([]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setCheckedUsers((prev) =>
      checked ? [...prev, value] : prev.filter((user) => user !== value)
    );
  };

  const handleSubmit = () => {
    onSubmit(checkedUsers);
  };

  return (
    <div className="flex gap-2 items-center flex-col fixed right-32 h-11/12 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
      <div className="flex w-full justify-between m-2">
        <h1 className="text-2xl m-1">Pick People</h1>
        <button
          className="btn btn-md btn-outline mr-3 btn-primary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {[1, 2, 3].map((id) => (
        <div
          key={id}
          className="flex items-center shadow-md w-11/12 justify-between min-h-19 border-solid border-blue-200 border-2"
        >
          <div className="flex items-center ml-2 gap-10">
            <div className="avatar">
              <div className="w-14 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <h1 className="text-base">User {id}</h1>
          </div>
          <input
            type="checkbox"
            className="form-checkbox mr-4"
            value={String(id)}
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
