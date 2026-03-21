import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial, TutorialStep } from "@/lib/tutorial-context";
import { Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stepContent: Record<TutorialStep, { title: string; desc: string; actionText?: string; autoAdvance?: boolean }> = {
  welcome: {
    title: "Welcome to AI Chat",
    desc: "Let's take a quick tour of your new private AI assistant. It's fast, private, and packed with features.",
    actionText: "Start Tour",
    autoAdvance: true
  },
  new_chat: {
    title: "Start a Conversation",
    desc: "Click the 'New Chat' button in the sidebar to begin your first session.",
  },
  type_message: {
    title: "Send a Message",
    desc: "Type a message in the input box below and hit Enter or the Send icon.",
  },
  voice_input: {
    title: "Use Your Voice",
    desc: "Tired of typing? Click the Microphone icon to speak your message.",
  },
  attach_file: {
    title: "Attach Files",
    desc: "Click the Paperclip icon to attach images, videos, or documents for the AI to analyze.",
  },
  hear_ai: {
    title: "Listen to Responses",
    desc: "Click the Speaker icon next to any AI response to hear it spoken aloud.",
  },
  delete_chat: {
    title: "Delete Chats",
    desc: "Hover over a session in the sidebar and click the Trash icon to securely delete it.",
  },
  completed: {
    title: "You're All Set!",
    desc: "Enjoy using your private AI assistant.",
  }
};

export function TutorialOverlay() {
  const { currentStep, advance, isCompleted } = useTutorial();

  if (isCompleted) return null;

  const content = stepContent[currentStep];
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "fixed z-50 p-6 max-w-sm w-full rounded-2xl glass-panel text-foreground",
          currentStep === "welcome" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "bottom-6 right-6"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-black text-white rounded-full shrink-0">
            {currentStep === "welcome" ? <Info size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{content.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {content.desc}
            </p>
            {content.autoAdvance && (
              <button
                onClick={() => advance(currentStep)}
                className="mt-4 w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors"
              >
                {content.actionText || "Next"}
              </button>
            )}
            {!content.autoAdvance && (
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground/80 bg-muted/50 p-2 rounded-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                </span>
                Waiting for you to complete this action...
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {currentStep === "welcome" && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
      )}
    </AnimatePresence>
  );
}
