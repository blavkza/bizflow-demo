"use client";

import { FaArrowRight } from "react-icons/fa";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput = ({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) => {
  return (
    <form onSubmit={onSubmit} className="fixed bottom-0 left-0 right-0 p-4  ">
      <div className="max-w-3xl mx-auto flex space-x-2 ml-[560px]">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask about finances, invoices, payments..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
            style={{
              height: "56px",
              maxHeight: "200px",
              scrollbarWidth: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-3 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
    </form>
  );
};
