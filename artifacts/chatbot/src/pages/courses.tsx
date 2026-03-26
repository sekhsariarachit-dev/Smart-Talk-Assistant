import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Play, Pause, ChevronRight, CheckCircle2,
  Send, Bell, BellOff, Star, Flame, Trophy, ArrowLeft, Volume2, BookOpen, Zap, Clock, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "ai_courses_progress_v2";
const STREAK_KEY = "ai_courses_streak";
const NOTIF_TIME_KEY = "ai_courses_notif_time";

interface HomeworkTask {
  task: string;
  example: string;
  type: "text" | "code";
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  emoji: string;
  content: string;
  homework: HomeworkTask[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  lessons: Lesson[];
}

const courses: Course[] = [
  {
    id: "ai-basics",
    title: "AI Basics",
    description: "Understand what artificial intelligence is and how it works",
    emoji: "🤖",
    gradient: "from-blue-600 to-cyan-500",
    lessons: [
      {
        id: "what-is-ai",
        title: "What is Artificial Intelligence?",
        duration: "5 min",
        emoji: "🧠",
        content: `Welcome, student! Today we start your AI journey. Let's begin — what IS artificial intelligence?

Artificial Intelligence, or AI, is when we teach computers to think and learn like humans. Imagine a very smart friend who reads millions of books and uses all that knowledge to answer any question. That's AI!

Types of AI you must know:

Narrow AI — Does ONE thing really well. Face recognition, Netflix recommendations, chess — smart at ONE task only.

General AI — Can do ANYTHING a human can do. Scientists are still building this. Not fully real yet!

Super AI — Future AI smarter than ALL humans combined. Still just a theory.

How AI learns: Think of teaching a child. Show them 1000 cat photos saying "cat" each time — they learn to recognize cats. AI works the same with millions of examples.

Real AI you use every day:
- Google Search — finds the best results for you
- YouTube — recommends your next video
- Siri and Alexa — understand your voice
- Your phone camera — makes photos look great
- Face ID — recognizes your face

AI is already all around you — you just didn't know!`,
        homework: [
          {
            task: "📝 Task 1 — Real-World AI: List 5 examples of AI you use in your daily life. For each one write: (1) What does it do? (2) How does it help you? Be specific and use your own words.",
            example: "Example: YouTube Recommendations — YouTube's AI watches what I watch and suggests similar videos. It learns from my history. This saves time finding videos I'll enjoy.",
            type: "text"
          },
          {
            task: "🤔 Task 2 — Think Critically: Which type of AI (Narrow, General, Super) is Siri? And which type would a robot that can do any job be? Explain your reasoning in 3–4 sentences.",
            example: "Think about: can Siri do anything or only specific things? What about a robot that could cook, clean, write code, and teach?",
            type: "text"
          },
          {
            task: "💻 Task 3 — Code Challenge: Write a Python program that asks the user to name 3 AI tools they use, stores them in a list, and prints them back with their index numbers.",
            example: "Expected output:\n1. YouTube\n2. Siri\n3. Google Maps\n\nHint: Use a list and a for loop with enumerate().",
            type: "code"
          }
        ]
      },
      {
        id: "ml-basics",
        title: "Machine Learning Explained",
        duration: "7 min",
        emoji: "⚙️",
        content: `Welcome back! Today we learn Machine Learning — the engine powering most AI today.

Machine Learning (ML) is AI that learns from experience WITHOUT being programmed for every situation.

Old way — Writing rules: "If whiskers + meow = cat." Problem: too many edge cases!
ML way — Show thousands of cat/dog photos. The computer finds patterns ITSELF.

The Three Types of Machine Learning:

Supervised Learning — Labeled examples train the AI. Like marking emails "spam" or "not spam." The AI learns from your labels. Used for: fraud detection, disease diagnosis.

Unsupervised Learning — No labels! AI finds its own patterns. Used for: grouping customers, finding unusual activity.

Reinforcement Learning — Trial and error with rewards. Like training a dog! Good action = reward, bad action = punishment. Used for: game AI, robots learning to walk, self-driving cars.

Real examples:
- Gmail spam filter → Supervised Learning
- Spotify playlists → Unsupervised Learning  
- AlphaGo (beats world chess champions) → Reinforcement Learning
- Your phone autocorrect → Supervised Learning

The core idea: The more data, the smarter the AI. That's why big tech companies collect so much data!`,
        homework: [
          {
            task: "📝 Task 1 — Explain ML: In your own words (5–6 sentences), explain how a spam email filter works using machine learning. Cover: What type of ML does it use? What does it learn from? How does it make decisions?",
            example: "Think: Every time you click 'Mark as Spam', what are you actually teaching the AI?",
            type: "text"
          },
          {
            task: "🔍 Task 2 — Classify These: For each of the following, write which type of ML it likely uses (Supervised/Unsupervised/Reinforcement) and why in one sentence:\na) Netflix recommending movies\nb) A robot learning to balance on one leg\nc) A bank detecting unusual transactions",
            example: "Format: 'Netflix → [type] because...'",
            type: "text"
          },
          {
            task: "💻 Task 3 — Code Challenge: Write Python code that simulates a simple supervised learning concept: create a dictionary where keys are animal names and values are their types ('cat' or 'dog'). Then write a function that takes a name and returns its type, or 'Unknown' if not found.",
            example: "animals = {'Max': 'dog', 'Whiskers': 'cat', 'Buddy': 'dog'}\n\ndef classify(name):\n    # your code here\n\nprint(classify('Max'))  # should print: dog\nprint(classify('Unknown'))  # should print: Unknown",
            type: "code"
          }
        ]
      },
      {
        id: "llms",
        title: "Large Language Models (LLMs)",
        duration: "6 min",
        emoji: "💬",
        content: `Great progress! Now let's learn about what powers ChatGPT and this very AI you're talking to — Large Language Models!

What is an LLM? Imagine someone read the ENTIRE internet — every book, article, Wikipedia, every forum. Then you ask them anything. That's basically an LLM!

How do they work? LLMs do one thing: predict the next word. If you say "The sky is..." they predict "blue." This simple ability, scaled to billions of examples, creates remarkable intelligence.

Famous LLMs:
- GPT-4 and GPT-5 by OpenAI — powers ChatGPT and this assistant!
- Gemini by Google
- Claude by Anthropic — focused on safety
- Llama by Meta — free and open source

Parameters — the "brain cells" of AI. GPT-4 has 1.8 TRILLION parameters. Each one helps understand language better.

What LLMs can do:
✦ Answer any question on any topic
✦ Write essays, stories, code, and poems
✦ Translate between 100+ languages
✦ Summarize long documents in seconds
✦ Debug your programs
✦ Analyze data and spot patterns

Important limitation: LLMs don't "know" things like humans do — they predict patterns. This is why they sometimes "hallucinate" (say wrong things confidently). ALWAYS verify important facts!`,
        homework: [
          {
            task: "📝 Task 1 — Explain to a Friend: Write 5–7 sentences explaining what an LLM is to someone who has never heard of AI. Use a creative analogy or comparison. Don't copy the lesson — use your own words and make it interesting!",
            example: "Start with: 'Imagine if someone...' or 'An LLM is like...' and make it easy to understand.",
            type: "text"
          },
          {
            task: "⚠️ Task 2 — Hallucination Awareness: Find or create an example of how an AI might 'hallucinate' (give confident but wrong information). Explain: (1) What did it say? (2) Why might the AI have said this? (3) How would you verify if it's true?",
            example: "Think about: dates, specific statistics, quotes from people, recent events — these are common areas where LLMs make mistakes.",
            type: "text"
          },
          {
            task: "💻 Task 3 — Code Challenge: Write Python code that simulates a basic 'next word prediction' concept. Create a dictionary where each word maps to the most likely next word, then write a function that generates a short sentence by following the chain.",
            example: "words = {'the': 'sky', 'sky': 'is', 'is': 'blue', 'blue': 'today', 'today': 'END'}\n\ndef generate(start, chain):\n    # your code here — follow the chain from start word\n    # stop when you reach 'END' or after 10 words\n\nprint(generate('the', words))  # should print: the sky is blue today",
            type: "code"
          }
        ]
      },
    ]
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    description: "Master the art of talking to AI for the best results",
    emoji: "✍️",
    gradient: "from-purple-600 to-pink-500",
    lessons: [
      {
        id: "what-is-prompting",
        title: "What is Prompt Engineering?",
        duration: "4 min",
        emoji: "🎯",
        content: `Hello! Today we unlock one of the most valuable skills in the AI age: Prompt Engineering.

A prompt is the instruction you give to AI. Prompt engineering is the skill of writing those instructions in the BEST possible way.

Think of it like giving instructions to a brilliant assistant. "Write something about dogs" — you might get anything. But "write a 200-word article about Golden Retriever intelligence for a 10-year-old" — now you get exactly what you need.

Same AI, same intelligence. Only the prompt changes. This is why prompt engineering is so powerful!

Why it matters:
- Two people using the same AI get VERY different results just from how they prompt
- Good prompts save hours of editing
- In some companies, skilled prompt engineers earn $300,000+ per year!

The basics every prompt needs:
1. Context — background information. Who is this for?
2. Task — exactly what you want
3. Format — how you want the answer structured
4. Tone — formal? casual? technical?

Bad vs Good:
❌ "Tell me about climate change"
✅ "Write a 3-paragraph summary of the main causes of climate change for a high school essay. Use simple language, include 2 specific examples, and end with a hopeful note about solutions."

The good prompt specifies: length, audience, language level, examples needed, and desired ending!`,
        homework: [
          {
            task: "📝 Task 1 — Bad to Good: Take this weak prompt: 'help me write an email' — Rewrite it as a GREAT prompt using: Context (to whom?), Task (what type?), Format (how long?), Tone (formal/casual?). Label each part of your improved prompt.",
            example: "Your great prompt should be specific enough that any AI would give the perfect response!",
            type: "text"
          },
          {
            task: "🎭 Task 2 — Write 3 Versions: Write 3 prompts asking AI to explain 'why the sky is blue': (1) A BAD prompt, (2) An OKAY prompt, (3) A GREAT prompt. For each, write one sentence explaining what makes it bad/okay/great.",
            example: "Show your understanding of specificity, audience, format, and context!",
            type: "text"
          },
          {
            task: "💻 Task 3 — Code Challenge: Write Python code that takes a user's topic input and automatically builds a well-structured prompt for them. The program should ask: (1) What is the topic? (2) Who is the audience? (3) What format (list/essay/steps)? Then print the assembled prompt.",
            example: "topic = input('What topic? ')\naudience = input('Who is this for? ')\nformat_type = input('Format (list/essay/steps)? ')\n\n# Build and print a great prompt using the above inputs",
            type: "code"
          }
        ]
      },
    ]
  },
  {
    id: "ai-coding",
    title: "AI-Powered Coding",
    description: "Write and debug code using AI assistance",
    emoji: "💻",
    gradient: "from-green-600 to-emerald-400",
    lessons: [
      {
        id: "first-python",
        title: "Your First Python Program with AI",
        duration: "10 min",
        emoji: "🐍",
        content: `Welcome to coding! Today you write your first Python program — and use AI to help at every step!

Don't worry if you've never coded. That's exactly why AI is revolutionary — it teaches you AND writes code WITH you!

What is Python? A programming language — instructions for your computer. Most popular language for AI and data science!

Your first program:
print("Hello, World!")

That's it! print() is a command, "Hello, World!" is the text to display.

Variables — boxes that store information:
name = "Arjun"
age = 16
print("My name is " + name)
print("I am " + str(age) + " years old")

Getting user input:
name = input("What is your name? ")
print("Hello, " + name + "!")

If statements — making decisions:
age = int(input("Enter your age: "))
if age >= 18:
    print("You are an adult!")
else:
    print("You are a minor!")

How to use AI for coding:
1. Ask AI to EXPLAIN: "What does this Python code do: [paste code]?"
2. Ask AI to WRITE: "Write Python code that calculates my BMI"
3. Ask AI to FIX: "I got this error: [paste error]. Fix it."
4. Ask AI to IMPROVE: "How can I make this code better?"

Golden rule: Always understand WHAT the code does, not just copy-paste!`,
        homework: [
          {
            task: "💻 Task 1 — Hello World Program: Write a Python program that: (1) Asks the user for their name, (2) Asks for their age, (3) Prints a personalized greeting like 'Hello Sara! You are 16 years old and that's awesome!' Submit your actual working code.",
            example: "name = input('Enter your name: ')\nage = input('Enter your age: ')\n# now print the greeting using name and age",
            type: "code"
          },
          {
            task: "💻 Task 2 — Calculator: Write a Python program that: (1) Asks for two numbers, (2) Asks which operation to perform (+, -, *, /), (3) Prints the result. Handle division by zero with an error message!",
            example: "Expected:\nEnter number 1: 10\nEnter number 2: 0\nOperation: /\nError: Cannot divide by zero!\n\nHint: Use if/elif/else and check for zero before dividing.",
            type: "code"
          },
          {
            task: "📝 Task 3 — Reflection: Describe your coding experience in 4–5 sentences: (1) What was the hardest part? (2) How did you debug errors? (3) Did you use AI to help? If yes, what did you ask it?",
            example: "Be honest! The goal is to reflect on your learning process.",
            type: "text"
          }
        ]
      },
    ]
  },
];

function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*\*/g, "").replace(/✦|✅|❌|📝|💻|🔍|⚠️|🎭|🤔/g, "").replace(/[^\w\s.,!?'":()—\-\n]/g, " ").substring(0, 3000);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.88; utterance.pitch = 1.05; utterance.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("google us"));
  if (preferred) utterance.voice = preferred;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

function scheduleNotificationAt(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target.getTime() - now.getTime();
  setTimeout(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        if (reg) { reg.showNotification("🎓 Time to study!", { body: `Your AI class is starting now! Keep your ${new Date().toLocaleDateString()} streak alive! 🔥` }); return; }
      }
      new Notification("🎓 Time to study!", { body: "Your AI class is starting now! Open the app to continue learning. 🔥" });
    } catch {}
  }, delay);
}

type View = "home" | "lesson";

export default function Courses() {
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [view, setView] = useState<View>("home");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [hwTexts, setHwTexts] = useState<string[]>([]);
  const [hwFeedbacks, setHwFeedbacks] = useState<(string | null)[]>([]);
  const [hwLoadings, setHwLoadings] = useState<boolean[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState("18:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) { const ids: string[] = JSON.parse(saved); setProgress(new Set(ids)); setXp(ids.length * 100); }
    const st = localStorage.getItem(STREAK_KEY);
    if (st) setStreak(parseInt(st) || 0);
    const nt = localStorage.getItem(NOTIF_TIME_KEY);
    if (nt) { setNotifEnabled(true); setNotifTime(nt); scheduleNotificationAt(nt); }
    window.speechSynthesis.getVoices();
  }, []);

  const markComplete = (lessonId: string) => {
    const next = new Set(progress);
    const wasNew = !next.has(lessonId);
    if (next.has(lessonId)) next.delete(lessonId); else next.add(lessonId);
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
    if (wasNew) {
      setXp(p => p + 100);
      const today = new Date().toDateString();
      if (localStorage.getItem("last_lesson_day") !== today) {
        const ns = streak + 1; setStreak(ns);
        localStorage.setItem(STREAK_KEY, String(ns));
        localStorage.setItem("last_lesson_day", today);
      }
    }
  };

  const openLesson = (course: Course, lesson: Lesson) => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveCourse(course);
    setActiveLesson(lesson);
    setView("lesson");
    setHwTexts(lesson.homework.map(() => ""));
    setHwFeedbacks(lesson.homework.map(() => null));
    setHwLoadings(lesson.homework.map(() => false));
  };

  const goHome = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setView("home");
    setActiveLesson(null);
    setActiveCourse(null);
  };

  const toggleSpeak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); }
    else if (activeLesson) speak(`Lesson: ${activeLesson.title}. ${activeLesson.content}`, () => setSpeaking(true), () => setSpeaking(false));
  };

  const submitHomework = async (taskIdx: number) => {
    if (!hwTexts[taskIdx]?.trim() || !activeLesson) return;
    setHwLoadings(prev => { const n = [...prev]; n[taskIdx] = true; return n; });
    setHwFeedbacks(prev => { const n = [...prev]; n[taskIdx] = null; return n; });
    try {
      const apiBase = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${apiBase}/api/chat/homework-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: `${activeLesson.title} — Task ${taskIdx + 1}`,
          homework: activeLesson.homework[taskIdx].task,
          studentWork: hwTexts[taskIdx],
        }),
      });
      const data = await res.json();
      const fb = data.feedback || "Great effort! Keep it up!";
      setHwFeedbacks(prev => { const n = [...prev]; n[taskIdx] = fb; return n; });
      markComplete(activeLesson.id);
      speak(`Feedback for task ${taskIdx + 1}! ${fb}`, () => setSpeaking(true), () => setSpeaking(false));
    } catch {
      setHwFeedbacks(prev => { const n = [...prev]; n[taskIdx] = "Could not connect to AI teacher. Please try again!"; return n; });
    } finally {
      setHwLoadings(prev => { const n = [...prev]; n[taskIdx] = false; return n; });
    }
  };

  const handleNotifToggle = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.removeItem(NOTIF_TIME_KEY);
      return;
    }
    if (!("Notification" in window)) { alert("Your browser doesn't support notifications."); return; }
    setShowTimePicker(true);
  };

  const confirmNotification = async () => {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      localStorage.setItem(NOTIF_TIME_KEY, notifTime);
      setShowTimePicker(false);
      scheduleNotificationAt(notifTime);
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready.catch(() => null);
          if (reg) { reg.showNotification("🎓 Reminder Set!", { body: `You'll get a daily class reminder at ${notifTime}. Keep learning! 🔥` }); return; }
        }
        new Notification("🎓 Reminder Set!", { body: `Daily class reminder set for ${notifTime}. Keep your streak alive! 🔥` });
      } catch {}
    } else {
      alert("Please allow notifications in your browser settings to use this feature.");
    }
  };

  const totalLessons = courses.reduce((a, c) => a + c.lessons.length, 0);
  const completed = progress.size;
  const pct = Math.round((completed / totalLessons) * 100);

  if (view === "lesson" && activeLesson && activeCourse) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className={cn("bg-gradient-to-r shrink-0 text-white px-4 py-3 flex items-center gap-3", activeCourse.gradient)}>
          <button onClick={goHome} className="p-2 hover:bg-white/20 rounded-xl transition-all"><ArrowLeft size={20} /></button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium opacity-80">{activeCourse.title}</p>
            <p className="font-bold text-base truncate">{activeLesson.title}</p>
          </div>
          <button onClick={toggleSpeak}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all", speaking ? "bg-white text-gray-800" : "bg-white/20 hover:bg-white/30")}>
            {speaking ? <><Pause size={16} />Pause</> : <><Volume2 size={16} />Listen</>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={cn("bg-gradient-to-r p-4 text-white flex items-center gap-3", activeCourse.gradient)}>
                <span className="text-3xl">{activeLesson.emoji}</span>
                <div><h2 className="font-bold text-lg leading-tight">{activeLesson.title}</h2><p className="text-xs opacity-80">{activeLesson.duration} lesson</p></div>
              </div>
              {speaking && (
                <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 bg-yellow-400 rounded-full animate-bounce" style={{ height: `${8+(i%3)*6}px`, animationDelay: `${i*0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-yellow-700">AI teacher is speaking...</span>
                  <button onClick={toggleSpeak} className="ml-auto text-xs text-yellow-600 hover:text-yellow-800 font-medium">Stop</button>
                </div>
              )}
              <div className="p-4">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{activeLesson.content}</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 flex items-center gap-2">
                <Zap size={18} className="text-white" />
                <span className="font-bold text-white">Homework Assignments</span>
                <span className="ml-auto text-xs bg-white/30 text-white px-2 py-0.5 rounded-full font-semibold">+100 XP each</span>
              </div>

              <div className="p-4 space-y-6">
                {activeLesson.homework.map((hw, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="bg-white rounded-xl border border-amber-200 p-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{hw.task}</p>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <p className="text-xs text-amber-700 font-semibold mb-0.5">💡 Hint</p>
                        <p className="text-xs text-gray-600 whitespace-pre-line">{hw.example}</p>
                      </div>
                    </div>
                    <textarea
                      value={hwTexts[idx] || ""}
                      onChange={e => setHwTexts(prev => { const n = [...prev]; n[idx] = e.target.value; return n; })}
                      placeholder={hw.type === "code" ? "# Write your Python code here...\n\n" : "Write your answer here..."}
                      rows={5}
                      className={cn("w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-amber-400 resize-none leading-relaxed",
                        hw.type === "code" && "font-mono")}
                    />
                    <button
                      onClick={() => submitHomework(idx)}
                      disabled={!hwTexts[idx]?.trim() || hwLoadings[idx]}
                      className={cn("w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                        hwTexts[idx]?.trim() && !hwLoadings[idx]
                          ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:shadow-md hover:-translate-y-0.5"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                      {hwLoadings[idx] ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Checking your work...</> : <><Send size={15} />Submit Task {idx + 1} for AI Review</>}
                    </button>
                    {hwFeedbacks[idx] && (
                      <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-400 px-4 py-2 flex items-center gap-2">
                          <Star size={15} className="text-white" />
                          <span className="font-bold text-white text-sm">AI Feedback — Task {idx + 1}</span>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{hwFeedbacks[idx]}</p>
                        </div>
                      </div>
                    )}
                    {idx < activeLesson.homework.length - 1 && <div className="border-t border-amber-200 pt-2" />}
                  </div>
                ))}

                <button onClick={() => markComplete(activeLesson.id)}
                  className={cn("w-full py-3 rounded-xl text-sm font-bold transition-all",
                    progress.has(activeLesson.id) ? "bg-green-100 text-green-700 border border-green-200" : "bg-black text-white hover:bg-gray-900")}>
                  {progress.has(activeLesson.id) ? "✅ Lesson Completed! +100 XP earned" : "Mark Lesson Complete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Set Daily Reminder</h3>
              <button onClick={() => setShowTimePicker(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600">Choose what time you want your daily AI class reminder:</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Clock size={20} className="text-gray-500" />
              <input type="time" value={notifTime} onChange={e => setNotifTime(e.target.value)}
                className="flex-1 text-2xl font-bold bg-transparent focus:outline-none text-black" />
            </div>
            <p className="text-xs text-gray-400">You'll receive a notification every day at this time reminding you to study!</p>
            <button onClick={confirmNotification}
              className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 flex items-center justify-center gap-2">
              <Bell size={18} />Set Reminder for {notifTime}
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><GraduationCap size={22} /><h1 className="font-bold text-xl">AI Learning Academy</h1></div>
          <button onClick={handleNotifToggle}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              notifEnabled ? "bg-green-500 text-white" : "bg-white/10 hover:bg-white/20 text-white")}>
            {notifEnabled ? <><Bell size={13} />Reminder: {notifTime}</> : <><BellOff size={13} />Set Reminder</>}
          </button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          {[{ icon: <Flame size={16} className="text-orange-400" />, val: `${streak} day streak` },
            { icon: <Trophy size={16} className="text-yellow-400" />, val: `${xp} XP` },
            { icon: <BookOpen size={16} className="text-blue-400" />, val: `${completed}/${totalLessons} done` }
          ].map(({ icon, val }) => (
            <div key={val} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl">
              {icon}<span className="font-bold text-xs">{val}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-white/50 mt-1 text-right">{pct}% complete</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">Welcome to your AI classroom!</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Each lesson has an AI teacher that <strong>speaks the content aloud</strong>. Each lesson includes <strong>2–3 homework tasks</strong> (including coding!) that the AI personally <strong>checks and grades</strong>. Set a daily reminder to keep your streak alive!
              </p>
            </div>
          </div>
        </div>

        {courses.map(course => {
          const cc = course.lessons.filter(l => progress.has(l.id)).length;
          const cpct = Math.round((cc / course.lessons.length) * 100);
          return (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={cn("bg-gradient-to-r p-4 text-white", course.gradient)}>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg leading-tight">{course.title}</h2>
                    <p className="text-sm opacity-90 mt-0.5">{course.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold bg-white/20 px-2 py-1 rounded-lg">{cc}/{course.lessons.length}</span>
                </div>
                <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${cpct}%` }} />
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {course.lessons.map(lesson => {
                  const done = progress.has(lesson.id);
                  return (
                    <button key={lesson.id} onClick={() => openLesson(course, lesson)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all text-left group">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all",
                        done ? "bg-black" : "bg-gray-100 group-hover:bg-gray-200")}>
                        {done ? <CheckCircle2 size={20} className="text-white" /> : lesson.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold truncate", done ? "text-gray-400 line-through" : "text-gray-800")}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{lesson.duration}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs font-medium text-orange-500">+100 XP</span>
                          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">{lesson.homework.length} tasks</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {done && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Done</span>}
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="text-center py-6 text-gray-400 text-sm">
          <p className="font-semibold">More courses coming soon! 🚀</p>
          <p className="text-xs mt-1">Keep your streak alive to unlock bonus content</p>
        </div>
      </div>
    </div>
  );
}
