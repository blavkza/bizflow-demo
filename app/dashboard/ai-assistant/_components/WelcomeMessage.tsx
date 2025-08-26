"use client";

import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { FaClipboard } from "react-icons/fa";

export const suggestedQuestions = [
  "What is the total overdue amount, broken down by aging periods?",
  "Give me a summary of this month’s income and expenses.",
  "Which clients have the largest unpaid invoices?",
  "Show the 10 most recent financial transactions.",
  "Which invoices are still partially paid and by how much?",
  "How much total revenue has been collected year-to-date?",
  "Provide a financial performance overview for this quarter.",
  "What are our top 5 expense categories this month?",
  "Which quotations are expiring within the next 7 days?",
  "List clients with high outstanding balances.",
  "What’s our current cash flow position and forecast for next month?",
  "Which projects are delayed due to outstanding invoices?",
  "Identify clients with consistent late payments.",
  "Show me a profit and loss summary for the last 3 months.",
  "Highlight any unusual or high-risk financial transactions.",
  "Which departments are over budget this quarter?",
  "What’s the average payment delay across all clients?",
  "Show me our top 5 revenue-generating clients.",
  "How does current revenue compare to last year’s?",
  "Which expense categories are trending upward?",
];

function getRandomQuestions(count: number) {
  const shuffled = [...suggestedQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

interface WelcomeMessageProps {
  onQuestionClick: (question: string) => void;
}

export const WelcomeMessage = ({ onQuestionClick }: WelcomeMessageProps) => {
  // Pick random questions only once on component mount
  const [randomQuestions] = useState(() => getRandomQuestions(6));

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
          <BrainCircuit className="text-blue-500 w-8 h-8" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-zinc-300 mb-1">
          BizFlow Assistant
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          Ask me about invoices, payments, cash flow, and more.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {randomQuestions.map((question, index) => (
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
