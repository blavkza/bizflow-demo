"use client";

import { useState, useRef, useEffect } from "react";
import {
  PanelLeftOpen,
  PanelRightOpen,
  Sidebar as SidebarIcon,
} from "lucide-react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Sidebar } from "./_components/Sidebar";
import { ChatArea } from "./_components/ChatArea";
import { ChatInput } from "./_components/ChatInput";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    isLoadingSessions,
    createNewSession,
    handleDeleteSession,
    setSessions,
  } = useChatSessions();

  // Get active session messages
  const activeSession = sessions.find(
    (session) => session.id === activeSessionId
  );
  const messages = activeSession?.messages || [];

  // Set active session when sessions load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const handleCreateNewSession = async () => {
    const newSession = await createNewSession();
    setActiveSessionId(newSession.id);
    setInput("");
    return newSession;
  };

  const handleDeleteSessionWrapper = async (sessionId: string) => {
    const success = await handleDeleteSession(sessionId);

    if (activeSessionId === sessionId) {
      if (sessions.length > 1) {
        const currentIndex = sessions.findIndex((s) => s.id === sessionId);
        const nextSession =
          sessions[currentIndex + 1] || sessions[currentIndex - 1];
        setActiveSessionId(nextSession.id);
      } else {
        handleCreateNewSession();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { content: input, role: "user" as const };

    let currentSessionId = activeSessionId;
    let currentSession = activeSession;

    // Only create new session if we don't have one AND user is submitting
    if (!currentSessionId || !currentSession) {
      const newSession = await handleCreateNewSession();
      currentSessionId = newSession.id;
      currentSession = newSession;
    }

    const updatedSession = {
      ...currentSession!,
      messages: [...currentSession!.messages, userMessage],
      updatedAt: Date.now(),
      title:
        currentSession!.messages.length === 0
          ? input.slice(0, 30) + (input.length > 30 ? "..." : "")
          : currentSession!.title,
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? updatedSession : session
      )
    );

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
      const aiMessage = { content: data.result, role: "ai" as const };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        updatedAt: Date.now(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? finalSession : session
        )
      );
    } catch (error) {
      console.error(error);
      const errorMessage = {
        content: "Sorry, I encountered an error. Please try again.",
        role: "ai" as const,
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: Date.now(),
      };

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? errorSession : session
        )
      );
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
  }, [messages]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleNewConversation = () => {
    createNewSession().then((session) => {
      setActiveSessionId(session.id);
      setInput("");
    });
  };

  return (
    <div className="flex h-screen ">
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className={`
        fixed md:relative w-64 bg-white dark:bg-zinc-800   flex flex-col z-30
        transition-all duration-300 ease-in-out h-full
        ${sidebarOpen ? "left-0" : "-left-64 md:left-0"}
      `}
        >
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            isLoadingSessions={isLoadingSessions}
            onSessionSelect={handleSessionSelect}
            onDeleteSession={handleDeleteSessionWrapper}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="px-4 py-2 mt-2  flex items-center">
          <Button onClick={toggleSidebar} variant={"ghost"} size={"icon"}>
            {sidebarOpen ? (
              <PanelRightOpen className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </Button>
          <h1 className="text-xl ml-2">{activeSession?.title || "New Chat"}</h1>
        </div>

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          title={activeSession?.title || "New Chat"}
          onSuggestedQuestion={handleSuggestedQuestion}
        />

        <div ref={messagesEndRef} />

        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
