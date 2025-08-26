import { WelcomeMessage } from "./WelcomeMessage";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";
import { ChatMessage } from "@/types/chatSessions";

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  title: string;
  onSuggestedQuestion: (question: string) => void;
}

export const ChatArea = ({
  messages,
  isLoading,
  title,
  onSuggestedQuestion,
}: ChatAreaProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
      {messages.length === 0 ? (
        <WelcomeMessage onQuestionClick={onSuggestedQuestion} />
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
      {isLoading && (
        <div className="flex justify-start">
          <div className=" text-gray-800 rounded-lg p-3 ">
            <LoadingIndicator />
          </div>
        </div>
      )}
    </div>
  );
};
