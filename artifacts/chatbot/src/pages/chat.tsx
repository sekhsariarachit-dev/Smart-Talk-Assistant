import React, { useState, useEffect, useRef } from "react";
import { Menu, Sparkles } from "lucide-react";
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

export default function Chat() {
  const { userId, isReady } = useAuth();
  const { currentStep, advance } = useTutorial();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleSendMessage = async (content: string, attachments: any[]) => {
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      const newSession = await createSessionMutation.mutateAsync({
        data: { userId: userId!, title: content.substring(0, 30) + "..." }
      });
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId: userId! }) });
    }

    // Optimistic cache update could go here, but we'll rely on the mutation's speed for simplicity 
    // and just show a loading state
    try {
      await sendMessageMutation.mutateAsync({
        data: {
          sessionId: currentSessionId,
          userId: userId!,
          content,
          attachments,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey({ sessionId: currentSessionId }) });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey({ userId: userId! }) }); // to update titles if needed
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <TutorialOverlay />
      
      <Sidebar
        userId={userId!}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNewSession={handleNewSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col relative w-full min-w-0">
        <header className="h-14 border-b border-border bg-white/80 backdrop-blur-md flex items-center px-4 shrink-0 sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 mr-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <div className="font-semibold text-lg flex items-center gap-2">
            {activeSessionId 
              ? sessions.find(s => s.id === activeSessionId)?.title || "Chat"
              : "Welcome to ChatAI"}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollRef}>
          {!activeSessionId && sessions.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
                <Sparkles size={40} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-md text-lg">
                Start a new conversation to securely interact with your private AI assistant.
              </p>
              <button
                onClick={handleNewSession}
                className="mt-8 px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-black/10"
              >
                Start a New Chat
              </button>
            </div>
          )}

          {activeSessionId && messages.length === 0 && !loadingMessages && (
             <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50">
               <Sparkles size={48} className="mb-4" />
               <p className="text-lg font-medium">Send a message to start the conversation.</p>
             </div>
          )}

          <div className="pb-32">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="w-full flex py-6 px-4 md:px-8 justify-start bg-gray-50/50 border-y border-gray-100">
                <div className="flex gap-4 max-w-4xl w-full flex-row">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-black border-black text-white">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 flex-1 items-start mt-2">
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

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-10 pb-4">
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={sendMessageMutation.isPending} 
          />
          <div className="text-center mt-2 text-xs text-gray-400 font-medium tracking-wide">
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>
      </main>
    </div>
  );
}
