import React from "react";
import { format } from "date-fns";
import { MessageSquare, Plus, Trash2, Menu, X } from "lucide-react";
import { ChatSession, useDeleteSession } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSessionsQueryKey } from "@workspace/api-client-react";
import { useTutorial } from "@/lib/tutorial-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userId: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ 
  userId, 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewSession,
  isOpen,
  onToggle
}: SidebarProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteSession();
  const { currentStep, advance } = useTutorial();

  const handleCreate = () => {
    onNewSession();
    if (currentStep === "new_chat") advance("new_chat");
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync({ sessionId });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId }) });
      if (activeSessionId === sessionId) {
        onSelectSession(""); // clear selection
      }
      if (currentStep === "delete_chat") advance("delete_chat");
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border bg-white">
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            <SparklesIcon /> ChatAI
          </h1>
          <button onClick={onToggle} className="md:hidden p-2 text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={handleCreate}
            className={cn(
              "w-full flex items-center gap-2 justify-center py-3 px-4 rounded-xl font-semibold transition-all duration-200",
              "bg-black text-white hover:bg-gray-900 shadow-md shadow-black/10 hover:shadow-lg active:scale-95",
              currentStep === "new_chat" && "ring-4 ring-black/20"
            )}
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-sm text-gray-400">
              No conversations yet. Start a new chat above!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group relative w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                  activeSessionId === session.id 
                    ? "bg-white shadow-sm border border-gray-100 text-black" 
                    : "text-gray-600 hover:bg-gray-100/50 hover:text-black border border-transparent"
                )}
              >
                <MessageSquare size={16} className={activeSessionId === session.id ? "text-black" : "text-gray-400"} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{session.title || "New Chat"}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {format(new Date(session.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all",
                    currentStep === "delete_chat" && "opacity-100 ring-2 ring-red-500/50 text-red-500 bg-red-50"
                  )}
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SparklesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
    </svg>
  );
}
