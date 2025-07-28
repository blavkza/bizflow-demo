"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export type Message = {
  content: string;
  role: "user" | "ai";
};

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  return (
    <div
      className={`max-w-[80%] rounded-2xl p-3.5 ${
        message.role === "user"
          ? "bg-blue-500 text-white shadow-sm"
          : "bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 border border-gray-100 dark:border-zinc-700 shadow-sm"
      }`}
    >
      {message.role === "user" ? (
        message.content
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <div className="mt-2 mb-2">
                  <div className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-t-md">
                    {match[1]}
                  </div>
                  <pre className="bg-gray-800 p-2 rounded-b-md overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code
                  className="bg-gray-200 px-1 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            a: ({ children, ...props }) => (
              <a
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
            h1: ({ children, ...props }) => (
              <h1 className="text-xl font-bold mt-4 mb-2" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-lg font-bold mt-3 mb-2" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-md font-bold mt-2 mb-1" {...props}>
                {children}
              </h3>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc pl-5 my-2" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal pl-5 my-2" {...props}>
                {children}
              </ol>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-3 italic my-2"
                {...props}
              >
                {children}
              </blockquote>
            ),
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border border-gray-300 dark:border-gray-600" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-gray-800"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-gray-300 px-2 py-1" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      )}
    </div>
  );
};
