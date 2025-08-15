"use client";

import {
  Dispatch,
  SetStateAction,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Send, Trash2 } from "lucide-react";
import { User } from "@/app/page";
import Image from "next/image";
import { memo } from "react";

const CHAT_STORAGE_PREFIX = "chat_";
const API_CHAT_URL = "/api/chat";
const DEBOUNCE_SAVE_MS = 500;
const MAX_RENDERED_MESSAGES = 100;

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface PersonaChatUIProps {
  selectedUser: User | null;
  messages: Record<string, ChatMessage[]>;
  setMessages: Dispatch<SetStateAction<Record<string, ChatMessage[]>>>;
  githubAvatar: string;
}
function markdownToHtml(markdown: string) {
  return (
    markdown
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

      // Bold
      .replace(
        /\*\*(.+?)\*\*/g,
        "<strong class='font-bold text-gray-900 dark:text-gray-100'>$1</strong>"
      )

      // Italic
      .replace(
        /_(.+?)_/g,
        "<em class='italic text-gray-900 dark:text-gray-100'>$1</em>"
      )

      // Inline code
      .replace(
        /`([^`]+)`/g,
        "<code class='bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 px-1 py-0.5 rounded font-mono text-sm'>$1</code>"
      )

      // Code block
      .replace(
        /```([\s\S]+?)```/g,
        "<pre class='bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 p-4 rounded-md font-mono text-sm leading-relaxed overflow-x-auto my-4'><code>$1</code></pre>"
      )

      // Headings
      .replace(
        /^### (.+)$/gm,
        "<h3 class='text-base font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3'>$1</h3>"
      )
      .replace(
        /^## (.+)$/gm,
        "<h2 class='text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-1'>$1</h2>"
      )
      .replace(
        /^# (.+)$/gm,
        "<h1 class='text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-1.5'>$1</h1>"
      )

      // Lists
      .replace(
        /^\s*[-*] (.+)$/gm,
        "<li class='list-disc ml-6 text-gray-900 dark:text-gray-100 leading-relaxed my-1'>$1</li>"
      )

      // New lines
      .replace(/\n/g, "<br class='my-1' />")
  );
}

const Message = memo(
  ({
    msg,
    selectedUser,
    githubAvatar,
  }: {
    msg: ChatMessage;
    selectedUser: User;
    index: number;
    githubAvatar: string;
  }) => (
    <div
      className={`max-w-xs p-3 rounded-lg animate-fadeIn flex items-center relative ${
        msg.sender === "user"
          ? "bg-blue-600 text-gray-200 self-end ml-auto"
          : "bg-gray-800 text-white"
      }`}
      role="listitem"
      aria-label={`${msg.sender === "user" ? "User" : "Bot"} message: ${
        msg.text
      }`}
      style={{
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      {msg.sender === "bot" ? (
        <span
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(msg.text),
          }}
        />
      ) : (
        msg.text
      )}

      {msg.sender === "bot" ? (
        <Image
          src={selectedUser.image}
          alt="user"
          height={30}
          width={30}
          className="rounded-full absolute -right-10 border border-white"
        />
      ) : (
        <Image
          src={githubAvatar || "/default.png"}
          alt="user"
          height={30}
          width={30}
          className="rounded-full absolute -left-10 border border-white"
        />
      )}
    </div>
  )
);

Message.displayName = "Message";

export default function PersonaChatUI({
  selectedUser,
  messages,
  setMessages,
  githubAvatar,
}: PersonaChatUIProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    const stored = localStorage.getItem(
      `${CHAT_STORAGE_PREFIX}${selectedUser.id}`
    );
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: stored
        ? JSON.parse(stored).slice(-MAX_RENDERED_MESSAGES)
        : [],
    }));
  }, [selectedUser, setMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, messages]);

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback(
    (chatId: string, msgs: ChatMessage[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            `${CHAT_STORAGE_PREFIX}${chatId}`,
            JSON.stringify(msgs)
          );
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      }, DEBOUNCE_SAVE_MS);
    },
    []
  );

  // Handle sending message and streaming response
  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedUser) return;

    const userMsg: ChatMessage = { sender: "user", text: input };
    const currentChatId = selectedUser.id;
    const updatedUserMsgs = [...(messages[currentChatId] || []), userMsg].slice(
      -MAX_RENDERED_MESSAGES
    );

    setMessages((prev) => ({
      ...prev,
      [currentChatId]: updatedUserMsgs,
    }));
    saveToLocalStorage(currentChatId, updatedUserMsgs);
    setInput("");

    try {
      const res = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          message: input,
          chatName: selectedUser.aliasName,
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const botReply: ChatMessage = { sender: "bot", text: "" };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setMessages((prev) => {
            const chatMessages = prev[currentChatId] || [];
            const lastMsg = chatMessages[chatMessages.length - 1];
            const newMsgs =
              lastMsg?.sender === "bot"
                ? [
                    ...chatMessages.slice(0, -1),
                    { ...lastMsg, text: botReply.text },
                  ]
                : [...chatMessages, { ...botReply }];

            saveToLocalStorage(currentChatId, newMsgs);
            return {
              ...prev,
              [currentChatId]: newMsgs.slice(-MAX_RENDERED_MESSAGES),
            };
          });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                botReply.text += data.content;
                setMessages((prev) => {
                  const chatMessages = prev[currentChatId] || [];
                  const lastMsg = chatMessages[chatMessages.length - 1];
                  const newMsgs =
                    lastMsg?.sender === "bot"
                      ? [
                          ...chatMessages.slice(0, -1),
                          { ...lastMsg, text: botReply.text },
                        ]
                      : [...chatMessages, { ...botReply }];

                  return {
                    ...prev,
                    [currentChatId]: newMsgs.slice(-MAX_RENDERED_MESSAGES),
                  };
                });
              }
            } catch (err) {
              console.error("Error parsing SSE chunk:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [
          ...(prev[currentChatId] || []),
          { sender: "bot", text: "Error: Could not fetch response." },
        ],
      }));
    }
  }, [input, selectedUser, messages, setMessages, saveToLocalStorage]);

  // Handle chat deletion
  const handleDeleteMessage = useCallback(() => {
    if (!selectedUser) return;
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${selectedUser.id}`);
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [],
    }));
  }, [selectedUser, setMessages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {selectedUser ? (
        <>
          {/* Header */}
          <div className="p-4 bg-gray-900 border-b border-gray-800 font-bold flex justify-between items-center">
            {selectedUser.name}
            <button onClick={handleDeleteMessage} aria-label="Delete chat">
              <Trash2 className="text-red-700 cursor-pointer" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {(messages[selectedUser.id] || []).length > 0 ? (
              <div role="list">
                {(messages[selectedUser.id] || [])
                  .slice(-MAX_RENDERED_MESSAGES)
                  .map((msg, idx) => (
                    <Message
                      key={idx}
                      msg={msg}
                      selectedUser={selectedUser}
                      index={idx}
                      githubAvatar={githubAvatar}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                No messages yet...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-gray-900 border-t border-gray-800 flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 border border-gray-700 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-white md:max-w-[90%]"
              aria-label="Message input"
            />
            <button
              onClick={handleSend}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          Select a persona to start chatting
        </div>
      )}
    </div>
  );
}
