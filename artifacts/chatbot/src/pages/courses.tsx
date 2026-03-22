import React, { useState, useEffect } from "react";
import { GraduationCap, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "ai_courses_progress";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  color: string;
  lessons: Lesson[];
}

const courses: Course[] = [
  {
    id: "ai-basics",
    title: "AI Basics",
    description: "Understand what artificial intelligence is and how it works",
    color: "bg-blue-50 border-blue-200",
    lessons: [
      { id: "what-is-ai", title: "What is Artificial Intelligence?", duration: "5 min", content: `**Artificial Intelligence (AI)** is the simulation of human intelligence by computer systems. AI enables machines to perform tasks that typically require human thinking — like recognizing speech, making decisions, translating languages, and understanding images.\n\n**Types of AI:**\n- **Narrow AI** — Designed for one specific task (e.g., face recognition, chess)\n- **General AI** — Can perform any intellectual task a human can (still theoretical)\n- **Super AI** — Surpasses human intelligence in all areas (theoretical)\n\n**How AI learns:**\nAI learns from data. The more data it sees, the better it gets — similar to how a child learns from experience.\n\n**Real-world AI examples:**\n- Google Search\n- Netflix recommendations\n- Siri & Alexa\n- Self-driving cars\n- Medical diagnosis tools` },
      { id: "ml-basics", title: "Machine Learning Explained", duration: "7 min", content: `**Machine Learning (ML)** is a branch of AI where computers learn from data without being explicitly programmed.\n\n**How it works:**\n1. You give the AI thousands of examples\n2. It finds patterns in the data\n3. It uses those patterns to make predictions on new data\n\n**Types of Machine Learning:**\n- **Supervised Learning** — Trained on labeled examples (cat/not-cat photos)\n- **Unsupervised Learning** — Finds hidden patterns in unlabeled data\n- **Reinforcement Learning** — Learns by trial and error with rewards (like training a dog)\n\n**Real examples:**\n- Email spam detection\n- Credit card fraud detection\n- Product recommendations\n- Voice assistants` },
      { id: "llms", title: "Large Language Models (LLMs)", duration: "6 min", content: `**Large Language Models (LLMs)** are AI systems trained on massive amounts of text. They can understand and generate human language.\n\n**Famous LLMs:**\n- **GPT-4/5** by OpenAI (powers ChatGPT)\n- **Gemini** by Google\n- **Claude** by Anthropic\n- **Llama** by Meta\n\n**How LLMs work:**\nThey predict the next word in a sequence based on everything they've learned. This simple idea, scaled to billions of parameters and trained on the entire internet, results in remarkably intelligent behavior.\n\n**What LLMs can do:**\n- Answer questions\n- Write code\n- Summarize documents\n- Translate languages\n- Create creative content\n- Analyze data` },
    ]
  },
  {
    id: "prompt-engineering",
    title: "Prompt Engineering",
    description: "Learn how to communicate effectively with AI to get the best results",
    color: "bg-purple-50 border-purple-200",
    lessons: [
      { id: "what-is-prompting", title: "What is Prompt Engineering?", duration: "4 min", content: `**Prompt Engineering** is the skill of writing instructions for AI systems to get the best possible output.\n\nThink of it like giving instructions to a very smart assistant — the clearer and more specific you are, the better the result.\n\n**Why it matters:**\nThe same AI can give very different answers depending on how you phrase your question. A well-crafted prompt can be the difference between a generic response and an incredibly useful one.\n\n**The basics:**\n- Be specific about what you want\n- Provide context\n- Tell the AI what format you want\n- Give examples if needed` },
      { id: "prompt-techniques", title: "Prompt Techniques That Work", duration: "8 min", content: `**Technique 1: Be Specific**\n❌ "Write about dogs"\n✅ "Write a 200-word informative paragraph about Golden Retrievers for a children's book"\n\n**Technique 2: Set the Role**\n"Act as an expert Python developer and review this code for bugs..."\n"You are a professional nutritionist. Create a meal plan for..."\n\n**Technique 3: Give Examples (Few-Shot)**\nShow the AI examples of what you want:\n"Summarize this in the style of:\nInput: [long text]\nSummary: [short summary]\nNow do the same for: [your text]"\n\n**Technique 4: Chain of Thought**\nAsk the AI to think step by step:\n"Solve this math problem step by step..."\n\n**Technique 5: Specify Format**\n"Give me the answer as a numbered list"\n"Format your response as a JSON object"\n"Use markdown with headers"` },
      { id: "advanced-prompting", title: "Advanced Prompting Strategies", duration: "10 min", content: `**1. Iterative Refinement**\nDon't expect perfection on the first try. Refine your prompt based on the output:\n- "This is good but make it more casual"\n- "Add more technical details to section 2"\n- "Shorten this to 100 words"\n\n**2. System Prompts**\nSet the AI's behavior at the start:\n"For this entire conversation, you are a financial advisor specializing in cryptocurrency. Only answer questions related to crypto investments."\n\n**3. Constraints**\nAdd boundaries to guide the AI:\n- "Do not use technical jargon"\n- "Keep each point to one sentence"\n- "Only use information from the document I provide"\n\n**4. Temperature Control (for developers)**\nLower temperature = more focused and deterministic\nHigher temperature = more creative and varied\n\n**5. The RISEN Framework:**\n- **R**ole: "You are a..."\n- **I**nstructions: "Your task is to..."\n- **S**teps: "Follow these steps..."\n- **E**nd Goal: "The goal is to..."\n- **N**arrow: "Only focus on..."` },
    ]
  },
  {
    id: "ai-tools",
    title: "AI Tools Overview",
    description: "Explore the most powerful AI tools available today",
    color: "bg-green-50 border-green-200",
    lessons: [
      { id: "chatgpt", title: "ChatGPT — The AI Assistant", duration: "5 min", content: `**ChatGPT** was released by OpenAI on **November 30, 2022**, and quickly became the fastest-growing consumer application in history.\n\n**What it can do:**\n- Answer any question\n- Write essays, emails, code, stories\n- Analyze and summarize documents\n- Help with math and science\n- Brainstorm ideas\n- Learn and tutor you on any topic\n\n**ChatGPT versions:**\n- **GPT-3.5** — Fast, free tier\n- **GPT-4** — More powerful, available in Plus\n- **GPT-4o** — Multimodal (can see images, hear voice)\n- **GPT-5** — Latest, most capable\n\n**Pro Tips:**\n- Use it to debug code by pasting your error\n- Ask it to explain complex topics "like I'm 10"\n- Use it to draft and then refine professional emails` },
      { id: "image-gen", title: "AI Image Generation", duration: "6 min", content: `**AI Image Generators** create images from text descriptions (prompts).\n\n**Popular tools:**\n- **DALL-E 3** (OpenAI) — Excellent at following instructions\n- **Midjourney** — Best for artistic, stylized images\n- **Stable Diffusion** — Open source, runs locally\n- **Adobe Firefly** — Integrated into Adobe products\n\n**Writing good image prompts:**\n1. Describe the subject clearly\n2. Specify the style (photorealistic, cartoon, oil painting...)\n3. Add lighting details (golden hour, studio lighting...)\n4. Mention composition (close-up, wide angle, aerial view...)\n\n**Example prompt:**\n"A majestic lion sitting on a rock at sunset, photorealistic, warm golden lighting, National Geographic style, high detail"\n\n**Use cases:**\n- Social media content\n- Logo concepts\n- Book illustrations\n- Marketing materials\n- Personal art` },
      { id: "ai-coding", title: "AI for Coding", duration: "7 min", content: `**AI coding assistants** can dramatically speed up software development.\n\n**Top tools:**\n- **GitHub Copilot** — Autocompletes code in your editor\n- **Cursor** — AI-native code editor\n- **ChatGPT/Claude** — Great for explaining and debugging\n- **Replit AI** — Builds full apps from descriptions\n\n**What AI can do for coding:**\n- Write functions from descriptions\n- Debug errors (paste the error message!)\n- Explain what code does\n- Convert code between languages\n- Write tests\n- Optimize slow code\n- Generate boilerplate\n\n**How to get the best coding help:**\n1. Paste the error message exactly\n2. Share the relevant code\n3. Describe what you expect vs what happens\n4. Ask it to explain its solution\n\n**Example:**\n"Here is my Python code. It should return the top 5 items by price but I'm getting an index error. [paste code] Fix the bug and explain what was wrong."` },
    ]
  },
  {
    id: "ai-safety",
    title: "AI Safety & Ethics",
    description: "Understanding responsible AI use and potential risks",
    color: "bg-orange-50 border-orange-200",
    lessons: [
      { id: "ai-limitations", title: "AI Limitations & Hallucinations", duration: "5 min", content: `**AI is powerful, but not perfect.** Understanding its limitations helps you use it more effectively.\n\n**Hallucinations:**\nAI can confidently state incorrect information. This is called "hallucination." The AI doesn't know what it doesn't know.\n\n**Examples of AI mistakes:**\n- Inventing fake research papers and citations\n- Getting recent events wrong (training data cutoff)\n- Making math errors\n- Misunderstanding context\n\n**How to protect yourself:**\n- Always verify important facts from primary sources\n- Don't use AI for medical, legal, or financial decisions without expert review\n- Ask the AI "How confident are you?" or "What are your sources?"\n- Be especially careful with numbers and statistics\n\n**When AI is most reliable:**\n- Well-established topics with lots of training data\n- Creative tasks (writing, brainstorming)\n- Explaining concepts\n- Code generation (but test the code!)` },
      { id: "privacy", title: "Privacy & AI", duration: "4 min", content: `**Protecting your privacy when using AI tools is important.**\n\n**What you should NEVER share with AI:**\n- Passwords or login credentials\n- Credit card or bank details\n- Your national ID number\n- Private medical information about yourself or others\n- Confidential business information\n- Personal details of other people without consent\n\n**How AI companies use your data:**\n- Conversations may be used to train future models\n- Some services offer "no training" options in settings\n- Enterprise plans often have stronger privacy protections\n\n**Best practices:**\n- Read the privacy policy of AI tools you use\n- Use the privacy settings available (e.g., turn off chat history)\n- Anonymize data before sharing (replace names with [NAME])\n- Use enterprise or self-hosted versions for sensitive work` },
    ]
  },
];

export default function Courses() {
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) setProgress(new Set(JSON.parse(saved)));
  }, []);

  const markComplete = (lessonId: string) => {
    const next = new Set(progress);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
  };

  const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const completed = progress.size;

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
        <GraduationCap size={20} />
        <h1 className="font-bold text-lg">AI Courses</h1>
        <div className="ml-auto text-sm text-gray-500">{completed}/{totalLessons} completed</div>
      </header>

      <div className="h-1.5 bg-gray-100 shrink-0">
        <div className="h-full bg-black transition-all duration-500" style={{ width: `${(completed / totalLessons) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {courses.map(course => {
          const courseCompleted = course.lessons.filter(l => progress.has(l.id)).length;
          return (
            <div key={course.id} className={cn("rounded-2xl border-2 overflow-hidden", course.color)}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-base">{course.title}</h2>
                    <p className="text-sm text-gray-600 mt-0.5">{course.description}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 shrink-0 ml-3">{courseCompleted}/{course.lessons.length}</span>
                </div>
              </div>
              <div className="border-t border-inherit divide-y divide-gray-100/50">
                {course.lessons.map(lesson => {
                  const done = progress.has(lesson.id);
                  const isOpen = openLesson === lesson.id;
                  return (
                    <div key={lesson.id} className="bg-white/70">
                      <button
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/90 transition-colors"
                        onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
                      >
                        <button
                          onClick={e => { e.stopPropagation(); markComplete(lesson.id); }}
                          className="shrink-0 text-gray-400 hover:text-black transition-colors"
                        >
                          {done ? <CheckCircle2 size={20} className="text-black" /> : <Circle size={20} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", done && "line-through text-gray-400")}>{lesson.title}</p>
                          <p className="text-xs text-gray-400">{lesson.duration} read</p>
                        </div>
                        {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-5">
                          <div className="bg-white rounded-xl p-4 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                            {lesson.content.split("\n\n").map((para, i) => (
                              <div key={i} className="mb-3">
                                {para.split("\n").map((line, j) => {
                                  const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
                                  return <p key={j} className="mb-1" dangerouslySetInnerHTML={{ __html: bold }} />;
                                })}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => markComplete(lesson.id)}
                            className={cn(
                              "mt-3 w-full py-2 rounded-xl text-sm font-semibold transition-all",
                              done ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
                            )}
                          >
                            {done ? "Mark as Incomplete" : "Mark as Complete"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
