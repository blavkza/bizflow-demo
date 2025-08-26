export interface ChatMessage {
  content: string;
  role: "user" | "ai";
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
