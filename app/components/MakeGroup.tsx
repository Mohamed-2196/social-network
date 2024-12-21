"use client";
import React, { useState } from "react";

function MakeGroup() {
  const [newGroupPopup, setNewGroupPopup] = useState(false);

  return (
    <>
      <div>
        <button
          className="btn btn-md btn-outline mr-3 btn-primary"
          onClick={() => setNewGroupPopup(true)}
        >
          + New Group
        </button>
      </div>
      {newGroupPopup ? (
        <>
          <div className="flex gap-2 items-center  flex-col fixed right-32 h-11/12 w-96 bg-slate-200 border-2 rounded-md border-solid border-blue-400">
            <div className="flex w-full justify-between m-2">
              <h1 className="text-2xl m-1">Create Group</h1>
              <button
                className="btn btn-md btn-outline mr-3 btn-primary"
                onClick={() => setNewGroupPopup(false)}
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
                ></input>
              </div>
              <div>
                <div className="flex flex-col items-center">
                  <p>Group Description</p>
                  <input
                    className="w-11/12"
                    type="text"
                    name="grouop-desc"
                    placeholder="Description"
                    required
                  ></input>
                </div>
              </div>
            </form>
            <br></br>
          </div>
        </>
      ) : (
        ""
      )}
    </>
  );
}

export default MakeGroup;
