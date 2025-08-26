import { useState, useEffect } from "react";
import {
  fetchSessions,
  createSession,
  updateSession,
  deleteSession,
} from "@/lib/chat";
import { ChatSession } from "@/types/chatSessions";

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    const storedSessions = await fetchSessions();
    setSessions(storedSessions);
    setIsLoadingSessions(false);
    return storedSessions;
  };

  const createNewSession = async () => {
    const newSessionData = {
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newSession = await createSession(newSessionData);

    if (newSession) {
      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    }

    // Fallback to local state if API fails
    const fallbackSession: ChatSession = {
      id: Date.now().toString(),
      ...newSessionData,
    };

    setSessions((prev) => [fallbackSession, ...prev]);
    return fallbackSession;
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedSession = {
      ...session,
      title: newTitle,
      updatedAt: Date.now(),
    };

    const apiSession = await updateSession(updatedSession);

    if (apiSession) {
      setSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? apiSession : session))
      );
    } else {
      // Fallback to local state if API fails
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? updatedSession : session
        )
      );
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);

    if (success) {
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    } else {
      // Fallback to local state if API fails
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    }

    return success;
  };

  return {
    sessions,
    isLoadingSessions,
    loadSessions,
    createNewSession,
    updateSessionTitle,
    handleDeleteSession,
    setSessions,
  };
};
