import { useState } from "react";

interface GitHubModalProps {
  onSubmit: (username: string) => void;
}

export default function GitHubModal({ onSubmit }: GitHubModalProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#101828] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-white">
        <h2 className="text-2xl font-bold mb-4 text-gray-200">
          Welcome to Persona AI
        </h2>
        <p className="mb-4 text-gray-600">
          Please enter your GitHub username to continue,<br/> it will only access your github profile picture
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GitHub username"
            className="w-full p-3 mb-4 border-none rounded focus:outline-none ring-2 ring-gray-500 focus:ring-gray-200"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
