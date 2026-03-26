import React from "react";
import { format } from "date-fns";
import { MessageSquare, Plus, Trash2, X, GraduationCap } from "lucide-react";
import { ChatSession, useDeleteSession } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSessionsQueryKey } from "@workspace/api-client-react";
import { useTutorial } from "@/lib/tutorial-context";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { Personality, ExplainLevel } from "@/pages/chat";

const PERSONALITIES: { id: Personality; emoji: string; label: string }[] = [
  { id: "default", emoji: "🤖", label: "Default" },
  { id: "teacher", emoji: "👨‍🏫", label: "Teacher" },
  { id: "funny", emoji: "😂", label: "Funny" },
  { id: "strict", emoji: "😤", label: "Strict" },
  { id: "motivator", emoji: "💪", label: "Hype" },
  { id: "friend", emoji: "🤝", label: "Friend" },
  { id: "photovideo", emoji: "📸", label: "Photo & Video" },
  { id: "teacher_course", emoji: "🎓", label: "Courses" },
];

const CLASS_LEVELS: { id: ExplainLevel; label: string; sublabel: string }[] = [
  { id: "class1", label: "Class 1–4", sublabel: "Primary" },
  { id: "class5", label: "Class 5–7", sublabel: "Middle" },
  { id: "class8", label: "Class 8–10", sublabel: "Secondary" },
  { id: "class11", label: "Class 11–12", sublabel: "Senior" },
  { id: "college", label: "College", sublabel: "Graduate" },
  { id: "professional", label: "Professional", sublabel: "Expert" },
];

const MINI_TOOLS: { emoji: string; label: string; prompt: string }[] = [
  { emoji: "📄", label: "Resume Builder", prompt: "Help me build a professional resume. Ask me about my name, experience, education, skills, and the job I'm targeting, then generate a polished resume." },
  { emoji: "🎮", label: "Game Idea", prompt: "Generate a unique, creative, and fun game idea. Include: title, concept, gameplay mechanics, target audience, and how to build a prototype." },
  { emoji: "💼", label: "Business Idea", prompt: "Generate a profitable and unique business idea. Include: problem it solves, target market, revenue model, and first steps to launch." },
  { emoji: "📝", label: "Homework Solver", prompt: "Help me with my homework. Ask me what subject and what the question/problem is, then explain the answer step by step." },
  { emoji: "📅", label: "Day Planner", prompt: "Help me plan my day. Ask me about my tasks, energy levels, and goals, then create a realistic schedule with time blocks." },
  { emoji: "🎬", label: "Reel Script", prompt: "Write a 30-60 second Instagram Reel script for me. Ask me about the topic, then generate: hook, scenes, captions, and voiceover text." },
];

const navLinks = [
  { href: "/courses", icon: GraduationCap, label: "AI Courses" },
];

interface SidebarProps {
  userId: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onToggle: () => void;
  personality: Personality;
  onPersonalityChange: (p: Personality) => void;
  explainLevel: ExplainLevel;
  onExplainLevelChange: (l: ExplainLevel) => void;
  onQuickPrompt: (prompt: string) => void;
}

export function Sidebar({
  userId,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  isOpen,
  onToggle,
  personality,
  onPersonalityChange,
  explainLevel,
  onExplainLevelChange,
  onQuickPrompt,
}: SidebarProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteSession();
  const { currentStep, advance } = useTutorial();
  const [location, navigate] = useLocation();

  const handleCreate = () => {
    if (location !== "/") navigate("/");
    onNewSession();
    if (currentStep === "new_chat") advance("new_chat");
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync({ sessionId });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId }) });
      if (activeSessionId === sessionId) {
        onSelectSession("");
      }
      if (currentStep === "delete_chat") advance("delete_chat");
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const handleMiniTool = (prompt: string) => {
    if (location !== "/") navigate("/");
    onQuickPrompt(prompt);
    if (window.innerWidth < 768) onToggle();
  };

  const safeSessions = Array.isArray(sessions) ? sessions : [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            <SparklesIcon /> ChatAI
          </h1>
          <button onClick={onToggle} className="md:hidden p-2 text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleCreate}
            className={cn(
              "w-full flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl font-semibold transition-all duration-200",
              "bg-black text-white hover:bg-gray-900 shadow-md shadow-black/10 hover:shadow-lg active:scale-95",
              currentStep === "new_chat" && "ring-4 ring-black/20"
            )}
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">AI Personality</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersonalityChange(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-xs font-medium transition-all border",
                    personality === p.id
                      ? "bg-black text-white border-black shadow-md"
                      : "text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <span className="text-base">{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Your Class</p>
            <select
              value={explainLevel || ""}
              onChange={(e) => onExplainLevelChange((e.target.value as ExplainLevel) || null)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-black transition-all appearance-none cursor-pointer"
            >
              <option value="">Select your class...</option>
              {CLASS_LEVELS.map((l) => (
                <option key={l.id} value={l.id ?? ""}>{l.label} — {l.sublabel}</option>
              ))}
            </select>
            {explainLevel && (
              <button
                onClick={() => onExplainLevelChange(null)}
                className="mt-1.5 w-full text-xs text-gray-400 hover:text-black transition-colors text-center"
              >
                Clear selection ✕
              </button>
            )}
          </div>

          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Mini Tools</p>
            <div className="space-y-1">
              {MINI_TOOLS.map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => handleMiniTool(tool.prompt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-black transition-all text-left"
                >
                  <span className="text-base">{tool.emoji}</span>
                  <span className="font-medium">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Tools</p>
            <div className="space-y-1">
              {navLinks.map(({ href, icon: Icon, label }) => (
                <button
                  key={href}
                  onClick={() => { navigate(href); if (window.innerWidth < 768) onToggle(); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    location === href
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Recent Chats</p>
            {safeSessions.length === 0 ? (
              <div className="text-center py-4 px-4 text-sm text-gray-400">
                No conversations yet.
              </div>
            ) : (
              <div className="space-y-1">
                {safeSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => { if (location !== "/") navigate("/"); onSelectSession(session.id); if (window.innerWidth < 768) onToggle(); }}
                    className={cn(
                      "group relative w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                      activeSessionId === session.id
                        ? "bg-gray-100 text-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    )}
                  >
                    <MessageSquare size={15} className={activeSessionId === session.id ? "text-black" : "text-gray-400"} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{session.title || "New Chat"}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {format(new Date(session.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SparklesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
    </svg>
  );
}
