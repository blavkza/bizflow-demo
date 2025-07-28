"use client";

export const LoadingIndicator = () => {
  return (
    <div className="flex space-x-2">
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
    </div>
  );
};