import { ChatSession } from "../types/chatSessions";

export const groupSessionsByDate = (sessions: ChatSession[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: { [key: string]: ChatSession[] } = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt);

    if (sessionDate >= today) {
      groups.Today.push(session);
    } else if (sessionDate >= yesterday) {
      groups.Yesterday.push(session);
    } else if (sessionDate >= lastWeek) {
      groups["Previous 7 Days"].push(session);
    } else {
      groups.Older.push(session);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
};
