import React, { useState } from "react";
import { format } from "date-fns";
import { User, Sparkles, FileText, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageItemProps {
  message: ChatMessage;
  onAction: (action: string, content: string) => void;
}

const AI_ACTIONS = [
  { id: "simplify", label: "Simplify", emoji: "✨" },
  { id: "example", label: "Example", emoji: "💡" },
  { id: "nextStep", label: "Next Step", emoji: "👉" },
  { id: "eli5", label: "ELI5", emoji: "👶" },
  { id: "expert", label: "Expert", emoji: "🧠" },
  { id: "reel", label: "Make Reel", emoji: "🎬" },
];

function detectEmotion(content: string): { emoji: string; label: string } | null {
  const lower = content.toLowerCase();
  if (/\b(sorry|unfortunate|cannot|error|fail|wrong|issue|problem)\b/.test(lower)) return { emoji: "😕", label: "Issue" };
  if (/\b(great|excellent|amazing|perfect|wonderful|fantastic|awesome)\b/.test(lower)) return { emoji: "🎉", label: "Excited" };
  if (/\b(careful|warning|important|note|remember|caution)\b/.test(lower)) return { emoji: "⚠️", label: "Heads up" };
  if (/\b(step|first|then|next|finally|because|therefore)\b/.test(lower)) return { emoji: "📝", label: "Structured" };
  if (/\?/.test(content)) return { emoji: "🤔", label: "Thoughtful" };
  return null;
}

export function ChatMessageItem({ message, onAction }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([message.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-response-${message.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emotion = !isUser ? detectEmotion(message.content) : null;

  return (
    <div className={cn(
      "w-full flex py-5 px-4 md:px-8 group",
      isUser ? "justify-end" : "justify-start bg-gray-50/40 border-y border-gray-100/80"
    )}>
      <div className={cn(
        "flex gap-3 max-w-3xl w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border mt-0.5",
          isUser ? "bg-white border-gray-200" : "bg-black border-black text-white"
        )}>
          {isUser ? <User size={17} className="text-gray-600" /> : <Sparkles size={17} />}
        </div>

        <div className={cn(
          "flex flex-col gap-2 min-w-0 flex-1",
          isUser ? "items-end" : "items-start"
        )}>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{isUser ? "You" : "AI Assistant"}</span>
            {emotion && !isUser && (
              <span className="text-xs" title={emotion.label}>{emotion.emoji}</span>
            )}
            <span>{format(new Date(message.createdAt), "h:mm a")}</span>
          </div>

          <div className={cn(
            "prose prose-sm md:prose-base prose-neutral max-w-none break-words w-full",
            isUser
              ? "bg-gray-100 rounded-2xl rounded-tr-sm px-5 py-3 text-black not-prose"
              : "text-black"
          )}>
            {isUser
              ? <p className="text-sm md:text-base">{message.content}</p>
              : <ReactMarkdown>{message.content}</ReactMarkdown>
            }
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
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

          {!isUser && (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-black hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                  title="Copy"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-black hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                  title="Download as text"
                >
                  ↓ Save
                </button>
                <button
                  onClick={() => setShowActions(v => !v)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-black hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                >
                  ✨ Actions {showActions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {showActions && (
                <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        onAction(action.id, message.content);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                    >
                      <span>{action.emoji}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
