"use client";

import Image from "next/image";
import React from "react";

type User = {
  id: string;
  name: string;
  image: string;
  aliasName: string;
};

interface ChatSidebarProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (user: User) => Promise<void>;
}

export default function ChatSidebar({
  users,
  selectedUserId,
  onSelect,
}: ChatSidebarProps) {
  return (
    <div className="w-full md:w-1/4 bg-gray-900 border-r border-gray-500 overflow-y-auto">
      <h2 className="p-4 text-lg font-bold border-b border-gray-500 text-white">
        Personas
      </h2>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`w-full border-b border-gray-800 text-left p-4 transition-colors duration-200 flex items-center gap-5 ${
            selectedUserId === user.id ? "bg-gray-800" : "hover:bg-gray-800"
          }`}
        >
          <div className="relative">
            <Image
              src={user.image}
              alt="user-image"
              height={40}
              width={40}
              className="rounded-full ring-1 ring-gray-400"
            />
            {selectedUserId === user.id && (
              <div className="size-2.5 absolute left-7.5 top-7.5 rounded-full bg-green-400 border border-white" />
            )}
          </div>
          <div className="font-semibold text-white">{user.name}</div>
        </button>
      ))}
    </div>
  );
}
