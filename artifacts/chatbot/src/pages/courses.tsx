import React, { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Play, Pause, Square, ChevronRight, CheckCircle2,
  Upload, Send, Bell, BellOff, Star, Flame, Trophy, ArrowLeft, Volume2, BookOpen, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "ai_courses_progress_v2";
const STREAK_KEY = "ai_courses_streak";
const NOTIFICATION_KEY = "ai_courses_notifications";

interface Homework {
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
  homework: Homework;
}

interface Course {
  id: string;
  title: string;
  description: string;
  emoji: string;
  gradient: string;
  accent: string;
  lessons: Lesson[];
}

const courses: Course[] = [
  {
    id: "ai-basics",
    title: "AI Basics",
    description: "Understand what artificial intelligence is and how it works",
    emoji: "🤖",
    gradient: "from-blue-500 to-cyan-400",
    accent: "blue",
    lessons: [
      {
        id: "what-is-ai",
        title: "What is Artificial Intelligence?",
        duration: "5 min",
        emoji: "🧠",
        content: `Welcome, student! Today we start your AI journey. Let's begin with the most important question — what IS artificial intelligence?

Artificial Intelligence, or AI, is when we teach computers to think and learn like humans. Imagine you have a very smart friend who reads millions of books, watches millions of videos, and then uses all that knowledge to answer your questions. That's basically what AI does!

Types of AI you should know:

Narrow AI — This AI does ONE thing really well. Like how your phone recognizes your face, or how Netflix knows what shows you'll like. It's smart, but only at that one task.

General AI — This is AI that can do ANYTHING a human can do. Scientists are still working on building this. It doesn't fully exist yet!

Super AI — This is a future AI that would be smarter than ALL humans combined. This is still just a theory.

How does AI actually learn? Think of it like teaching a child. If you show a child 1000 pictures of cats and say "this is a cat" each time, the child learns to recognize cats. AI works the same way — just with millions of examples instead of 1000.

Real-world AI you use every day:
- Google Search uses AI to find the best results for you
- YouTube uses AI to recommend your next video
- Siri and Alexa use AI to understand your voice
- Your phone's camera uses AI to make your photos look great

Pretty amazing, right? AI is already all around you!`,
        homework: {
          task: "List 5 examples of AI you use in your daily life. For each one, write 2-3 sentences explaining: (1) What does it do? (2) How does it make your life easier? Be creative and specific!",
          example: "Example: 1. YouTube Recommendations — YouTube's AI watches what videos I like and suggests similar ones. It learns from my viewing history. This saves me time finding videos I'll enjoy.",
          type: "text"
        }
      },
      {
        id: "ml-basics",
        title: "Machine Learning Explained",
        duration: "7 min",
        emoji: "⚙️",
        content: `Welcome back, student! Today we're going deeper. We're learning about Machine Learning — the engine that powers most AI today.

Machine Learning, or ML, is a type of AI where computers learn from experience WITHOUT being specifically programmed for every situation. Sounds magical? Let me explain!

Imagine you want to teach a computer to tell cats from dogs. The OLD way would be to write rules: "If it has whiskers and meows, it's a cat." But what about unusual cats? What about dogs that look like cats? The rules would get too complicated!

Machine Learning takes a DIFFERENT approach:
Step 1: Show the computer thousands of labeled photos — "cat", "dog", "cat", "dog"
Step 2: The computer finds patterns on its own — shapes, colors, sizes, features
Step 3: Now give it a NEW photo — it uses those patterns to guess correctly!

The Three Types of Machine Learning:

Supervised Learning — You give labeled examples. "This email is spam, this is not spam." The AI learns from your labels. Used for: email filters, disease diagnosis, fraud detection.

Unsupervised Learning — No labels! The AI finds its own patterns. Used for: grouping customers by behavior, finding unusual activity in data.

Reinforcement Learning — The AI learns by trial and error with rewards. Like training a dog with treats! The AI tries an action, gets a "reward" if it's good, gets "punished" if it's bad. Used for: game-playing AI, robots learning to walk.

Real examples you might not have thought about:
- Your email spam filter uses supervised learning
- Banks use ML to spot fraudulent transactions in milliseconds
- Spotify uses ML to create your personalized playlists
- Self-driving cars use ML to understand road situations`,
        homework: {
          task: "Explain how a spam email filter works using machine learning concepts from today's lesson. Write at least 4-5 sentences covering: (1) What type of ML does it use? (2) What does it learn from? (3) How does it make decisions? (4) What happens when it makes mistakes?",
          example: "Think about it: every time you mark an email as spam, you're giving the AI a labeled example to learn from!",
          type: "text"
        }
      },
      {
        id: "llms",
        title: "Large Language Models (LLMs)",
        duration: "6 min",
        emoji: "💬",
        content: `Great progress, student! Now we're learning about the technology behind ChatGPT, Claude, and other modern AI assistants — Large Language Models, or LLMs.

What is an LLM? Imagine someone read the ENTIRE internet — every book, article, Wikipedia page, forum, code repository — and remembered all of it. Then you could ask them anything. That's basically an LLM!

But here's the clever part about HOW they work:

LLMs are trained to do one thing: predict the next word. That's it! If you give them "The sky is...", they've seen so many examples that they know "blue" is a great next word. But this simple ability, when scaled to BILLIONS of examples, creates remarkably intelligent behavior.

Famous LLMs you should know:
- GPT-4 and GPT-5 by OpenAI — powers ChatGPT and this very assistant you're using!
- Gemini by Google — Google's answer to ChatGPT
- Claude by Anthropic — focused on being helpful and safe
- Llama by Meta — open source, anyone can use it

Parameters — the brain cells of AI. A parameter is like a single connection in the AI's "brain". GPT-4 has about 1.8 TRILLION parameters. Each one helps the AI understand language better.

What can LLMs do?
✦ Answer any question on any topic
✦ Write essays, stories, poems, and code
✦ Translate between hundreds of languages
✦ Summarize long documents
✦ Debug your programs
✦ Have natural conversations
✦ Analyze data and find patterns

One important thing: LLMs don't "know" things like humans do. They recognize patterns in language. That's why they can sometimes make mistakes or "hallucinate" — they predict words that sound right but aren't actually true. Always verify important facts!`,
        homework: {
          task: "Write a short explanation (5-7 sentences) of what a Large Language Model is, written as if you're explaining it to a friend who has never heard of AI. Use simple language, an analogy or comparison, and at least one real-world example. Don't copy the lesson — use your own words!",
          example: "Tip: Try explaining it like 'An LLM is like...' and use something your friend understands.",
          type: "text"
        }
      },
    ]
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    description: "Learn how to communicate effectively with AI to get the best results",
    emoji: "✍️",
    gradient: "from-purple-500 to-pink-500",
    accent: "purple",
    lessons: [
      {
        id: "what-is-prompting",
        title: "What is Prompt Engineering?",
        duration: "4 min",
        emoji: "🎯",
        content: `Hello, student! Today we unlock one of the most valuable skills in the AI age: Prompt Engineering.

What is a prompt? A prompt is the instruction or question you give to an AI. And prompt engineering is the skill of writing those instructions in the BEST possible way to get exactly what you want.

Think of it this way: if you hire a brilliant assistant and you say "write something about dogs" — you might get anything. An essay, a poem, a joke, a recipe with dogs in the title! But if you say "write a 200-word informative article about the intelligence of Golden Retrievers for a 10-year-old audience" — now you'll get exactly what you need.

The same AI, the same intelligence. The ONLY difference is the prompt. This is why prompt engineering is so powerful!

Why does prompting matter?
- Two people using the same AI can get VERY different results just from how they write their prompts
- Good prompts can save you hours of editing and rewriting
- In some companies, skilled prompt engineers earn $300,000+ per year!

The basics every prompt should have:
1. Context — Give the AI background information. Who is this for? What situation?
2. Task — Be specific about exactly what you want
3. Format — Tell the AI how you want the answer formatted
4. Tone — Formal? Casual? Technical? Simple?

Bad prompt vs Good prompt:
❌ "Tell me about climate change"
✅ "Write a 3-paragraph summary of the main causes of climate change for a high school essay. Use simple language, include 2 specific examples, and end with a hopeful note about solutions."

See the difference? The good prompt gives context, specifies length, target audience, language level, examples needed, and even the desired ending!`,
        homework: {
          task: "Write 3 different prompts for this task: 'I want the AI to help me write an apology message to my friend.' Write one BAD prompt, one OKAY prompt, and one GREAT prompt. Explain in one sentence why each prompt is bad, okay, or great.",
          example: "Show your understanding of context, specificity, format, and tone in your great prompt!",
          type: "text"
        }
      },
      {
        id: "prompt-techniques",
        title: "Prompt Techniques That Work",
        duration: "8 min",
        emoji: "🔧",
        content: `Welcome back! Let's build your prompt engineering toolkit. These techniques work every time!

TECHNIQUE 1: Role Assignment
Give the AI a specific role to play. This dramatically changes the quality and style of the response.
Example: "You are an expert nutritionist with 20 years of experience. Explain why breakfast is important."
vs: "Explain why breakfast is important."
The role assignment gets you a more authoritative, detailed answer!

TECHNIQUE 2: Be Specific About Format
Tell the AI EXACTLY how you want the answer:
- "Give me a numbered list of 5 tips"
- "Format this as a table with columns for Name, Price, Pros, Cons"
- "Write this as a dialogue between two people"
- "Respond with only bullet points, no paragraphs"

TECHNIQUE 3: Few-Shot Examples
Show the AI what you want with examples:
"Summarize news articles like this:
Article: [long text]
Summary: [short 2-sentence summary]

Now do the same for this article: [your article]"

TECHNIQUE 4: Chain of Thought
Ask the AI to think step by step for complex problems:
"Solve this step by step, showing your work: [math problem]"
"Think through this carefully before answering: [complex question]"

TECHNIQUE 5: Specify Your Audience
"Explain quantum physics to a 10-year-old"
"Explain quantum physics to a physics professor"
"Explain quantum physics to someone who loves cooking — use food analogies"

TECHNIQUE 6: Set Constraints
Boundaries help the AI stay focused:
"Explain in exactly 3 sentences"
"Only include examples from the last 5 years"
"Do not use technical jargon"
"Keep the reading level at Grade 7"

COMBINING TECHNIQUES:
"You are a professional chef [ROLE]. Write a recipe for chocolate cake [TASK] that a complete beginner can follow [AUDIENCE]. Format it as numbered steps [FORMAT] and keep each step to one sentence [CONSTRAINT]. Include a fun tip at the end [EXTRA]."`,
        homework: {
          task: "Take this weak prompt: 'help me study' — and rewrite it using AT LEAST 3 different techniques from today's lesson. Label which technique you used for each part of your improved prompt. Then explain in 2 sentences why your rewritten prompt is better.",
          example: "Your final prompt should be detailed, specific, and get a much more useful response!",
          type: "text"
        }
      },
    ]
  },
  {
    id: "ai-coding",
    title: "AI-Powered Coding",
    description: "Use AI to write, debug, and understand code",
    emoji: "💻",
    gradient: "from-green-500 to-emerald-400",
    accent: "green",
    lessons: [
      {
        id: "first-python",
        title: "Your First Python Program with AI",
        duration: "10 min",
        emoji: "🐍",
        content: `Welcome to coding class! Today you're going to write your first Python program — and use AI to help you understand every line!

Don't worry if you've never coded before. That's exactly why AI is so powerful — it can teach you and write code WITH you!

What is Python? Python is a programming language — a way to give instructions to a computer. It's the most popular language for AI and data science, and it's designed to be easy to read.

Your first program — "Hello World":
print("Hello, World!")

That's it! That ONE line tells the computer to display the words "Hello, World!" on screen. Let's break it down:
- print() — this is a "function", a command that does something
- "Hello, World!" — this is a "string", a piece of text

Now let's write something more personal:

name = "Arjun"
age = 16
print("My name is " + name)
print("I am " + str(age) + " years old")

Breaking this down:
- name = "Arjun" — we're creating a "variable", a box that stores information
- age = 16 — storing the number 16 in a variable called age
- str(age) — converting the number to text so we can combine it with words

How to use AI for coding:
1. Ask AI to EXPLAIN code: "What does this Python code do: [paste code]?"
2. Ask AI to WRITE code: "Write Python code that asks for my name and says hello to me"
3. Ask AI to FIX errors: "I got this error: [paste error]. Here's my code: [paste code]. What's wrong?"
4. Ask AI to IMPROVE code: "Here's my Python code. How can I make it better?"

The golden rule of AI-assisted coding: Always understand WHAT the code does, not just copy-paste it. When you understand, you can modify and build on it!

Your task today: Write a Python program that asks the user for their name and favorite color, then prints a personalized message like "Hello Sara! Your favorite color blue is amazing!"`,
        homework: {
          task: "Write a Python program that: (1) Asks the user for their name, (2) Asks for their favorite number, (3) Multiplies that number by 2 and prints it, (4) Prints a final encouraging message. Submit your actual code below. Use AI to help you if you get stuck — that's allowed! Just make sure you understand each line.",
          example: "Example output: 'Enter your name: Sara | Enter your favorite number: 7 | Your number doubled is: 14 | Great job Sara, you coded your first program!'",
          type: "code"
        }
      },
    ]
  },
];

function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/\*\*/g, "")
    .replace(/✦/g, "")
    .replace(/❌|✅/g, "")
    .replace(/[^\w\s.,!?'":\-()\n]/g, " ")
    .substring(0, 3000);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.88;
  utterance.pitch = 1.05;
  utterance.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google us english") || v.name.toLowerCase().includes("samantha"));
  if (preferred) utterance.voice = preferred;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

type View = "home" | "lesson";

export default function Courses() {
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [view, setView] = useState<View>("home");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [hwText, setHwText] = useState("");
  const [hwFeedback, setHwFeedback] = useState<string | null>(null);
  const [hwLoading, setHwLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [xp, setXp] = useState(0);
  const hwRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      const ids: string[] = JSON.parse(saved);
      setProgress(new Set(ids));
      setXp(ids.length * 100);
    }
    const st = localStorage.getItem(STREAK_KEY);
    if (st) setStreak(parseInt(st) || 0);
    const notif = localStorage.getItem(NOTIFICATION_KEY);
    if (notif === "true") setNotifEnabled(true);
    window.speechSynthesis.getVoices();
  }, []);

  const markComplete = (lessonId: string) => {
    const next = new Set(progress);
    const wasNew = !next.has(lessonId);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
    if (wasNew) {
      setXp(p => p + 100);
      const today = new Date().toDateString();
      const lastDay = localStorage.getItem("last_lesson_day");
      if (lastDay !== today) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem(STREAK_KEY, String(newStreak));
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
    setHwText("");
    setHwFeedback(null);
  };

  const goHome = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setView("home");
    setActiveLesson(null);
    setActiveCourse(null);
  };

  const toggleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else if (activeLesson) {
      const intro = `Lesson: ${activeLesson.title}. ${activeLesson.content}`;
      speak(intro, () => setSpeaking(true), () => setSpeaking(false));
    }
  };

  const submitHomework = async () => {
    if (!hwText.trim() || !activeLesson) return;
    setHwLoading(true);
    setHwFeedback(null);
    try {
      const apiBase = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${apiBase}/api/chat/homework-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: activeLesson.title,
          homework: activeLesson.homework.task,
          studentWork: hwText,
        }),
      });
      const data = await res.json();
      setHwFeedback(data.feedback || "Great effort! Keep it up!");
      if (activeLesson) markComplete(activeLesson.id);
      if (!speaking) {
        speak(`Here is your feedback! ${data.feedback}`, () => setSpeaking(true), () => setSpeaking(false));
      }
    } catch {
      setHwFeedback("Could not connect to the AI teacher. Please try again!");
    } finally {
      setHwLoading(false);
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Your browser doesn't support notifications.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      localStorage.setItem(NOTIFICATION_KEY, "true");
      new Notification("🎓 AI Learning Academy", {
        body: "You're all set! You'll get daily reminders to keep your learning streak alive! 🔥",
        icon: "/favicon.ico",
      });
    }
  };

  const totalLessons = courses.reduce((a, c) => a + c.lessons.length, 0);
  const completed = progress.size;
  const pct = Math.round((completed / totalLessons) * 100);

  if (view === "lesson" && activeLesson && activeCourse) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className={cn("bg-gradient-to-r shrink-0 text-white px-4 py-3 flex items-center gap-3", activeCourse.gradient)}>
          <button onClick={goHome} className="p-2 hover:bg-white/20 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium opacity-80">{activeCourse.title}</p>
            <p className="font-bold text-base truncate">{activeLesson.title}</p>
          </div>
          <button
            onClick={toggleSpeak}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all",
              speaking ? "bg-white text-gray-800" : "bg-white/20 hover:bg-white/30"
            )}
          >
            {speaking ? <><Pause size={16} /> Pause</> : <><Volume2 size={16} /> Listen</>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={cn("bg-gradient-to-r p-4 text-white flex items-center gap-3", activeCourse.gradient)}>
                <span className="text-3xl">{activeLesson.emoji}</span>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{activeLesson.title}</h2>
                  <p className="text-xs opacity-80">{activeLesson.duration} lesson</p>
                </div>
              </div>
              {speaking && (
                <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 bg-yellow-400 rounded-full animate-bounce"
                        style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-yellow-700">AI teacher is speaking...</span>
                  <button onClick={toggleSpeak} className="ml-auto text-xs text-yellow-600 hover:text-yellow-800 font-medium">Stop</button>
                </div>
              )}
              <div className="p-4">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                  {activeLesson.content}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 flex items-center gap-2">
                <Zap size={18} className="text-white" />
                <span className="font-bold text-white">Homework Assignment</span>
                <span className="ml-auto text-xs bg-white/30 text-white px-2 py-0.5 rounded-full font-semibold">+100 XP</span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 leading-relaxed">{activeLesson.homework.task}</p>
                <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold mb-1">💡 Hint</p>
                  <p className="text-xs text-gray-600">{activeLesson.homework.example}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600">Your Answer:</label>
                  <textarea
                    ref={hwRef}
                    value={hwText}
                    onChange={e => setHwText(e.target.value)}
                    placeholder={activeLesson.homework.type === "code"
                      ? "# Write your Python code here...\n\nname = input('Enter your name: ')\n..."
                      : "Write your answer here..."
                    }
                    rows={6}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-amber-400 resize-none leading-relaxed",
                      activeLesson.homework.type === "code" && "font-mono"
                    )}
                  />
                  <button
                    onClick={submitHomework}
                    disabled={!hwText.trim() || hwLoading}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      hwText.trim() && !hwLoading
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {hwLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI teacher is checking your work...
                      </>
                    ) : (
                      <><Send size={16} /> Submit for AI Review</>
                    )}
                  </button>
                </div>

                {hwFeedback && (
                  <div className="bg-white rounded-xl border-2 border-green-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-400 px-4 py-2 flex items-center gap-2">
                      <Star size={16} className="text-white" />
                      <span className="font-bold text-white text-sm">AI Teacher Feedback</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{hwFeedback}</p>
                    </div>
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => markComplete(activeLesson.id)}
                        className={cn(
                          "w-full py-2.5 rounded-xl text-sm font-bold transition-all",
                          progress.has(activeLesson.id)
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-black text-white hover:bg-gray-900"
                        )}
                      >
                        {progress.has(activeLesson.id) ? "✅ Lesson Completed! +100 XP earned" : "Mark Lesson Complete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={22} />
            <h1 className="font-bold text-xl">AI Learning Academy</h1>
          </div>
          <button
            onClick={requestNotifications}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              notifEnabled ? "bg-green-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            {notifEnabled ? <><Bell size={13} /> Reminders ON</> : <><BellOff size={13} /> Set Reminder</>}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
            <Flame size={16} className="text-orange-400" />
            <span className="font-bold text-sm">{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-bold text-sm">{xp} XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
            <BookOpen size={16} className="text-blue-400" />
            <span className="font-bold text-sm">{completed}/{totalLessons} done</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-white/60 mt-1 text-right">{pct}% complete</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">Welcome to your AI classroom!</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Each lesson has an AI teacher that <strong>speaks</strong> the content aloud, and a homework assignment that the AI will <strong>personally check and grade</strong> for you. Learn at your own pace!
              </p>
            </div>
          </div>
        </div>

        {courses.map(course => {
          const courseCompleted = course.lessons.filter(l => progress.has(l.id)).length;
          const coursePct = Math.round((courseCompleted / course.lessons.length) * 100);
          return (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={cn("bg-gradient-to-r p-4 text-white", course.gradient)}>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg leading-tight">{course.title}</h2>
                    <p className="text-sm opacity-90 mt-0.5">{course.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold bg-white/20 px-2 py-1 rounded-lg">
                    {courseCompleted}/{course.lessons.length}
                  </span>
                </div>
                <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${coursePct}%` }} />
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {course.lessons.map((lesson, idx) => {
                  const done = progress.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => openLesson(course, lesson)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all text-left group"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all",
                        done ? "bg-black" : "bg-gray-100 group-hover:bg-gray-200"
                      )}>
                        {done ? <CheckCircle2 size={20} className="text-white" /> : lesson.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold truncate", done ? "text-gray-400 line-through" : "text-gray-800")}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{lesson.duration}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs font-medium text-orange-500">+100 XP</span>
                          {!done && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-500">Includes homework</span>}
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
