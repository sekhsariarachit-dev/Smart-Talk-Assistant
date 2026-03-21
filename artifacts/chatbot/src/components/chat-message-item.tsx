import React from "react";
import { format } from "date-fns";
import { User, Sparkles, FileText } from "lucide-react";
import { ChatMessage } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn(
      "w-full flex py-6 px-4 md:px-8",
      isUser ? "justify-end" : "justify-start bg-gray-50/50 border-y border-gray-100"
    )}>
      <div className={cn(
        "flex gap-4 max-w-4xl w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
          isUser ? "bg-white border-gray-200" : "bg-black border-black text-white"
        )}>
          {isUser ? <User size={20} className="text-gray-600" /> : <Sparkles size={20} />}
        </div>

        <div className={cn(
          "flex flex-col gap-2 min-w-0 flex-1",
          isUser ? "items-end" : "items-start"
        )}>
          <div className="flex items-baseline gap-2 text-xs text-gray-400">
            <span className="font-semibold text-gray-700">{isUser ? "You" : "AI Assistant"}</span>
            <span>{format(new Date(message.createdAt), "h:mm a")}</span>
          </div>

          <div className={cn(
            "prose prose-sm md:prose-base prose-neutral max-w-none break-words",
            isUser ? "bg-gray-100 rounded-2xl rounded-tr-sm px-5 py-3 text-black" : "text-black"
          )}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm max-w-sm">
                  {att.type.startsWith("image/") ? (
                    <img src={att.url} alt={att.name} className="max-w-full h-auto max-h-48 object-contain bg-gray-50" />
                  ) : att.type.startsWith("video/") ? (
                    <video src={att.url} controls className="max-w-full h-auto max-h-48 bg-black" />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                        <FileText size={20} className="text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
