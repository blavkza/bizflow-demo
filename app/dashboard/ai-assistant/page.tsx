"use client";

import { useState, useRef, useEffect } from "react";
import { WelcomeMessage } from "./_components/WelcomeMessage";
import { MessageBubble } from "./_components/MessageBubble";
import { LoadingIndicator } from "./_components/LoadingIndicator";
import { ChatInput } from "./_components/ChatInput";

export type Message = {
  content: string;
  role: "user" | "ai";
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { content: input, role: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const aiMessage: Message = { content: data.result, role: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        content: "Sorry, I encountered an error. Please try again.",
        role: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(event);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const style = document.createElement("style");
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [messages]);

  return (
    <div className="flex flex-col h-screen ">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 hide-scrollbar">
        {messages.length === 0 ? (
          <WelcomeMessage onQuestionClick={handleSuggestedQuestion} />
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <MessageBubble message={message} />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {isLoading && (
          <div className="flex justify-start">
            <div className=" text-gray-800 rounded-lg p-3 border border-gray-200">
              <LoadingIndicator />
            </div>
          </div>
        )}
      </div>

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
