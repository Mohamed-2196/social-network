import React from "react";
import Nav from "@/app/components/nav";

const GroupChat = () => {
  return (
    <div className="flex min-h-full flex-col gap-2">
      <Nav></Nav>
      <div className="flex justify-between gap-3 grow bg-slate-200 m-1">
        <div className="items-center flex flex-col gap-2 h-auto basis-1/4 bg-slate-300">
          <h1 className="text-3xl">My Groups</h1>
          <div className="flex gap-3 rounded-md w-11/12 items-center h-12 bg-slate-100">
            <div className="basis-2/12 avatar">
              <div className="w-9/12 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <h1 className="basis-10/12 text-2xl">Mohammed Is Gay</h1>
          </div>
          <div className="flex gap-3 rounded-md w-11/12 items-center h-12 bg-slate-100">
            <div className="basis-2/12 avatar">
              <div className="w-9/12 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <h1 className="basis-10/12 text-2xl">Mohammed Is Gay</h1>
          </div>
          <div className="flex gap-3  rounded-md w-11/12 items-center h-12 bg-slate-100">
            <div className="basis-2/12 avatar">
              <div className="w-9/12 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>
            <h1 className="basis-10/12 text-2xl">Mohammed Is Gay</h1>
          </div>
        </div>
        <div className="h-auto basis-3/4 bg-slate-200">
          <div className="flex  flex-col h-full">
            <div className="h-auto flex justify-between pl-2 pr-2 items-center bg-slate-200 basis-1/12">
              <h1 className="text-3xl">Marriage Network</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </div>
            <div className="h-auto bg-slate-200 basis-11/12">
              <div className="chat chat-start">
                <div className="chat-header">
                  Sayed
                  <time className="text-xs opacity-50">2 hours ago</time>
                </div>
                <div className="chat-bubble">Bro Mohammed is Gay</div>
              </div>
              <div className="chat chat-end">
                <div className="chat-header">
                  Yousif
                  <time className="text-xs opacity-50">2 hours ago</time>
                </div>
                <div className="chat-bubble">Yeah I know man GG</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;


