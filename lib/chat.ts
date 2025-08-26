import { ChatSession } from "../types/chatSessions";

export const fetchSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch("/api/chat-sessions");
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};

export const createSession = async (
  session: Omit<ChatSession, "id">
): Promise<ChatSession | null> => {
  try {
    const response = await fetch("/api/chat-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });
    if (!response.ok) throw new Error("Failed to create session");
    return await response.json();
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
};

export const updateSession = async (
  session: ChatSession
): Promise<ChatSession | null> => {
  try {
    const response = await fetch("/api/chat-sessions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(session),
    });
    if (!response.ok) throw new Error("Failed to update session");
    return await response.json();
  } catch (error) {
    console.error("Error updating session:", error);
    return null;
  }
};

export const deleteSession = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/chat-sessions?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete session");
    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    return false;
  }
};
