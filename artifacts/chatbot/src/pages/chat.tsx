import React, { useState, useEffect, useRef } from "react";
import { Menu, Sparkles, NotebookPen, ListTodo } from "lucide-react";
import {
  useListSessions,
  useCreateSession,
  useListMessages,
  useSendMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListSessionsQueryKey,
  getListMessagesQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useTutorial } from "@/lib/tutorial-context";
import { Sidebar } from "@/components/sidebar";
import { ChatInput } from "@/components/chat-input";
import { ChatMessageItem } from "@/components/chat-message-item";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { NotebookPanel, ProjectPanel } from "@/components/session-panels";
import { cn } from "@/lib/utils";

export type Personality = "default" | "teacher" | "funny" | "strict" | "motivator" | "friend";
export type ExplainLevel = "child" | "student" | "expert" | null;

const QUICK_PROMPTS = [
  { icon: "📅", label: "Plan my day", prompt: "Help me plan my day. Ask me about my tasks, goals, and time constraints, then create a schedule." },
  { icon: "📚", label: "Study for exam", prompt: "Help me study for an exam. Ask me what subject and topic, then quiz me and explain concepts." },
  { icon: "💡", label: "Business idea", prompt: "Help me develop a business idea. Ask me about my interests and skills, then brainstorm profitable ideas." },
  { icon: "✍️", label: "Write a blog", prompt: "Help me write a blog post. Ask me about the topic and audience, then draft a complete post." },
  { icon: "🎮", label: "Game idea", prompt: "Generate a unique and fun game idea with concept, mechanics, and how to build it." },
  { icon: "📄", label: "Build my resume", prompt: "Help me build a professional resume. Ask me about my experience, skills, and the job I'm targeting." },
];

export default function Chat() {
  const { userId, isReady } = useAuth();
  const { currentStep, advance } = useTutorial();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<"notebook" | "project" | null>(null);
  const [personality, setPersonality] = useState<Personality>("default");
  const [explainLevel, setExplainLevel] = useState<ExplainLevel>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loadingSessions } = useListSessions(
    { userId: userId || "" },
    { query: { enabled: isReady } }
  );

  const { data: messages = [], isLoading: loadingMessages } = useListMessages(
    { sessionId: activeSessionId || "" },
    { query: { enabled: !!activeSessionId } }
  );

  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sendMessageMutation.isPending]);

  if (!isReady) return null;

  const handleNewSession = async () => {
    try {
      const newSession = await createSessionMutation.mutateAsync({
        data: { userId: userId! }
      });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId: userId! }) });
      setActiveSessionId(newSession.id);
      if (currentStep === "new_chat") advance("new_chat");
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  const handleSendMessage = async (content: string, attachments: any[], generateMode?: string) => {
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      const newSession = await createSessionMutation.mutateAsync({
        data: { userId: userId!, title: content.substring(0, 30) + "..." }
      });
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId: userId! }) });
    }

    try {
      const result = await sendMessageMutation.mutateAsync({
        data: {
          sessionId: currentSessionId,
          userId: userId!,
          content,
          attachments,
          personality: personality !== "default" ? personality : undefined,
          explainLevel: explainLevel || undefined,
          generateMode,
        } as any
      });
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ sessionId: currentSessionId }) });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId: userId! }) });

      if (currentStep === "type_message") advance("type_message");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    await handleNewSession();
    setTimeout(() => handleSendMessage(prompt, []), 100);
  };

  const handleActionOnMessage = (action: string, messageContent: string) => {
    const actions: Record<string, string> = {
      simplify: `Please simplify this explanation so it's easier to understand: "${messageContent.substring(0, 200)}..."`,
      nextStep: `Based on your previous response, what's the next step I should take?`,
      example: `Give me a concrete real-world example for what you just explained.`,
      eli5: `Explain that again but like I'm 5 years old, using very simple words and a fun analogy.`,
      expert: `Now explain that at an expert level with technical depth and advanced details.`,
      reel: `Turn your last response into a 30-60 second Instagram Reel script. Include: hook, main content split into 3-4 scenes, caption text, and voiceover lines.`,
    };
    if (actions[action]) {
      handleSendMessage(actions[action], []);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <TutorialOverlay />

      <Sidebar
        userId={userId!}
        sessions={Array.isArray(sessions) ? sessions : []}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        personality={personality}
        onPersonalityChange={setPersonality}
        explainLevel={explainLevel}
        onExplainLevelChange={setExplainLevel}
        onQuickPrompt={handleQuickPrompt}
      />

      <main className="flex-1 flex relative w-full min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col relative min-w-0">
          <header className="h-14 border-b border-border bg-white/80 backdrop-blur-md flex items-center px-4 shrink-0 sticky top-0 z-10 gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 mr-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="font-semibold text-lg flex items-center gap-2 flex-1 min-w-0 truncate">
              {activeSessionId
                ? (Array.isArray(sessions) ? sessions : []).find(s => s.id === activeSessionId)?.title || "Chat"
                : "ChatAI"}
            </div>
            {activeSessionId && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setRightPanel(p => p === "notebook" ? null : "notebook")}
                  title="Notebook"
                  className={cn("p-2 rounded-lg transition-colors", rightPanel === "notebook" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black")}
                >
                  <NotebookPen size={18} />
                </button>
                <button
                  onClick={() => setRightPanel(p => p === "project" ? null : "project")}
                  title="Project Tasks"
                  className={cn("p-2 rounded-lg transition-colors", rightPanel === "project" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100 hover:text-black")}
                >
                  <ListTodo size={18} />
                </button>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollRef}>
            {!activeSessionId && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
                  <Sparkles size={40} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Your personal AI — chat, generate content, plan, and create.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl mb-8">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-black hover:shadow-md transition-all text-left group"
                    >
                      <span className="text-2xl">{qp.icon}</span>
                      <span className="font-semibold text-sm text-gray-700 group-hover:text-black">{qp.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNewSession}
                  className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-black/10"
                >
                  Start a New Chat
                </button>
              </div>
            )}

            {activeSessionId && messages.length === 0 && !loadingMessages && (
              <div className="flex flex-col items-center pt-12 p-8 text-center opacity-50">
                <Sparkles size={48} className="mb-4" />
                <p className="text-lg font-medium">Send a message to start the conversation.</p>
              </div>
            )}

            <div className="pb-36">
              {(Array.isArray(messages) ? messages : []).map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onAction={handleActionOnMessage}
                />
              ))}

              {sendMessageMutation.isPending && (
                <div className="w-full flex py-6 px-4 md:px-8 justify-start bg-gray-50/50 border-y border-gray-100">
                  <div className="flex gap-4 max-w-4xl w-full flex-row">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-black border-black text-white">
                      <Sparkles size={20} />
                    </div>
                    <div className="flex flex-col gap-2 min-w-0 flex-1 items-start mt-2">
                      <p className="text-xs text-gray-400 font-medium animate-pulse">AI is thinking…</p>
                      <div className="flex space-x-1.5 p-3 rounded-2xl">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pb-4">
            <ChatInput
              onSend={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
            <div className="text-center mt-1 text-xs text-gray-400 font-medium tracking-wide">
              AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>

        {rightPanel && activeSessionId && (
          <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            {rightPanel === "notebook" && (
              <NotebookPanel sessionId={activeSessionId} onClose={() => setRightPanel(null)} />
            )}
            {rightPanel === "project" && (
              <ProjectPanel sessionId={activeSessionId} onClose={() => setRightPanel(null)} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
