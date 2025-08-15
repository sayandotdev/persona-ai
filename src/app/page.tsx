"use client";

import { useState, useEffect } from "react";
import ChatSidebar from "@/components/Sidebar";
import PersonaChatUI from "@/components/Chat";
import GitHubModal from "@/components/GitHubModal"; // Import the modal

export type User = {
  id: string;
  name: string;
  image: string;
  aliasName: string;
};

export type ChatMessage = {
  sender: "user" | "bot";
  text: string;
};

const users: User[] = [
  {
    id: "52029d42-2630-4c05-96cc-69b05d54fc0a",
    name: "Hitesh Choudhary",
    aliasName: "hitesh_choudhary",
    image: "https://avatars.githubusercontent.com/u/11613311?v=4",
  },
  {
    id: "1a67d610-8d55-49a3-a15e-699dfd9af367",
    name: "Piyush Garg",
    aliasName: "piyush_garg",
    image: "https://avatars.githubusercontent.com/u/44976328?v=4",
  },
];

export default function Home() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [showModal, setShowModal] = useState(true);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubAvatar, setGithubAvatar] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("githubUsername");
    if (storedUsername) {
      setGithubUsername(storedUsername);
      setShowModal(false);
    }
  }, []);

  const handleUsernameSubmit = (username: string) => {
    setGithubUsername(username);
    localStorage.setItem("githubUsername", username);
    setShowModal(false);
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
  };

  useEffect(() => {
    fetch(`https://api.github.com/users/${githubUsername}`)
      .then((response) => response.json())
      .then((data) => setGithubAvatar(data?.avatar_url || "/default.png"))
      .catch(() => setGithubAvatar("/default.png"));
  }, [githubUsername]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-white">
      {/* Modal */}
      {showModal && <GitHubModal onSubmit={handleUsernameSubmit} />}

      {/* Sidebar */}
      <ChatSidebar
        users={users}
        selectedUserId={selectedUser?.id || null}
        onSelect={handleSelectUser}
      />

      {/* Chat Area */}
      <PersonaChatUI
        selectedUser={selectedUser}
        messages={messages}
        setMessages={setMessages}
        githubAvatar={githubAvatar}
      />
    </div>
  );
}
