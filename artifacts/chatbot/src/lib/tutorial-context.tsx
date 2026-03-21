import React, { createContext, useContext, useState, useEffect } from "react";

export type TutorialStep = 
  | "welcome" 
  | "new_chat" 
  | "type_message" 
  | "voice_input" 
  | "attach_file" 
  | "hear_ai" 
  | "delete_chat" 
  | "completed";

interface TutorialContextType {
  currentStep: TutorialStep;
  advance: (expectedCurrentStep: TutorialStep) => void;
  reset: () => void;
  isCompleted: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_KEY = "chatbot_tutorial_completed";

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<TutorialStep>("completed");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY) === "true";
    setCurrentStep(completed ? "completed" : "welcome");
    setIsLoaded(true);
  }, []);

  const advance = (expectedCurrentStep: TutorialStep) => {
    if (currentStep !== expectedCurrentStep) return;

    const steps: TutorialStep[] = [
      "welcome",
      "new_chat",
      "type_message",
      "voice_input",
      "attach_file",
      "hear_ai",
      "delete_chat",
      "completed"
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);
      if (nextStep === "completed") {
        localStorage.setItem(TUTORIAL_KEY, "true");
      }
    }
  };

  const reset = () => {
    localStorage.removeItem(TUTORIAL_KEY);
    setCurrentStep("welcome");
  };

  if (!isLoaded) return null;

  return (
    <TutorialContext.Provider value={{ 
      currentStep, 
      advance, 
      reset,
      isCompleted: currentStep === "completed" 
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within TutorialProvider");
  return context;
};
