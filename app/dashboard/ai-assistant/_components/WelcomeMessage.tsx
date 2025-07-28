"use client";

import { FaClipboard } from "react-icons/fa";

export const suggestedQuestions = [
  "What is the total amount overdue?",
  "Show me a summary of all transactions made this month.",
  "List clients with unpaid invoices.",
  "What are the most recent transactions?",
  "Which invoices are partially paid?",
  "How much revenue have we collected so far?",
  "Can you provide a financial overview for this term?",
  "What are our top expense categories?",
  "List quotations that are about to expire",
  "Show me clients with pending payments",
  "What's our current cash flow status?",
  "Which projects have outstanding invoices?",
];

interface WelcomeMessageProps {
  onQuestionClick: (question: string) => void;
}

export const WelcomeMessage = ({ onQuestionClick }: WelcomeMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
          <FaClipboard className="text-blue-500 w-8 h-8" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-zinc-300 mb-1">
          FinanceFlow Assistant
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          Ask me about invoices, payment, and more.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {suggestedQuestions.slice(0, 6).map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 hover:border-blue-400 text-gray-700 dark:text-zinc-300 px-4 py-2 rounded-full text-sm transition-colors duration-200 shadow-sm hover:shadow hover:bg-blue-50 dark:hover:bg-zinc-500"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};
