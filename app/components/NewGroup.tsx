"use client";
import React, { useState } from "react";

function NewGroup() {
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
              <h1 className="text-2xl m-1">Pick People</h1>
              <button
                className="btn btn-md btn-outline mr-3 btn-primary"
                onClick={() => setNewGroupPopup(false)}
              >
                Close
              </button>
            </div>
            <div className="flex items-center shadow-md w-11/12 justify-between min-h-19 border-solid border-blue-200 border-2">
              <div className="flex items-center ml-2 gap-10 ">
                <div className="avatar">
                  <div className="w-14 rounded-full">
                    <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                  </div>
                </div>
                <h1 className="text-base">Mohammed Is Gay</h1>
              </div>
            </div>
            <br></br>
          </div>
        </>
      ) : (
        ""
      )}
    </>
  );
}

export default NewGroup;
