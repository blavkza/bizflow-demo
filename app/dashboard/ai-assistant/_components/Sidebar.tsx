import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { groupSessionsByDate } from "@/lib/dateGrouping";
import { ChatSession } from "@/types/chatSessions";
import { Trash, Plus } from "lucide-react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoadingSessions: boolean;
  onSessionSelect: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewConversation: () => void;
}

export const Sidebar = ({
  sessions,
  activeSessionId,
  isLoadingSessions,
  onSessionSelect,
  onDeleteSession,
  onNewConversation,
}: SidebarProps) => {
  const groupedSessions = groupSessionsByDate(sessions);

  const SessionSkeleton = () => (
    <div className="p-3 rounded-md ">
      <div className="flex justify-between items-center">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 dark:bg-zinc-700" />
          <Skeleton className="h-3 w-1/2 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );

  const GroupSkeleton = () => (
    <div className="mb-4">
      <Skeleton className="h-4 w-1/4 mb-2 mx-2" />
      {[...Array(3)].map((_, i) => (
        <SessionSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {" "}
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h2 className="text-lg font-semibold">Chats</h2>
          </div>

          <Button onClick={onNewConversation} variant={"ghost"} size={"icon"}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingSessions ? (
          <div className="space-y-2">
            {[...Array(1)].map((_, i) => (
              <GroupSkeleton key={i} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-4">No chat history yet</p>
            {/* <button
              onClick={onNewConversation}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Start a conversation
            </button> */}
          </div>
        ) : (
          Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
            <div key={groupName} className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-2">
                {groupName}
              </h3>
              {groupSessions.map((session) => (
                <div
                  key={session.id}
                  className={`px-3 py-2 rounded-md mb-1 cursor-pointer flex justify-between items-center group ${
                    activeSessionId === session.id
                      ? "bg-gray-50 dark:bg-zinc-900"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-900 border border-transparent"
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <div className="truncate flex-1">
                    <div className="font-medium truncate text-sm">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(session.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className=" text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
