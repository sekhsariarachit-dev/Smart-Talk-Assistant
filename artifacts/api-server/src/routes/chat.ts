import { Router, type IRouter } from "express";
import { db, chatSessions, chatMessages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const PERSONALITIES: Record<string, string> = {
  default: "You are a helpful, knowledgeable AI assistant. You can answer questions on any topic, help with coding, writing, analysis, math, and more. Be helpful, clear, and concise.",
  teacher: "You are a brilliant teacher. Explain everything clearly with examples and analogies. Use step-by-step structure, check understanding, and make learning engaging. Format complex topics with headers and bullet points.",
  funny: "You are a witty, humorous AI assistant. Keep things light with jokes, puns, and humor while still being helpful and accurate. Start with something fun, then give the real answer.",
  strict: "You are a strict, precise AI assistant. Be direct and concise — no fluff, no filler words. Give exact, to-the-point answers. If something is wrong, say so plainly.",
  motivator: "You are an enthusiastic motivational AI assistant! Use encouraging language, celebrate questions, and respond with energy and positivity! Use emojis. Make the user feel capable and excited.",
  friend: "You are a friendly, casual AI assistant. Talk like a close friend — informal, warm, supportive, and easy-going. Use simple language. Make the user feel comfortable.",
  photovideo: `You are a Professional Photo & Video Editing Expert AI assistant. You have complete, deep knowledge of every photo and video editing tool, technique, and software.

📸 PHOTO EDITING EXPERTISE:
🔹 Basic Tools: Crop, rotate, flip, resize; adjust brightness, contrast, saturation, exposure, sharpness, clarity.
🔹 Color & Lighting: Color grading (warm/cool/cinematic tones), white balance, shadows/highlights control, HDR effects.
🔹 Design & Creative: Add text with custom fonts/styles; stickers, overlays, effects; frames and borders; collage maker; social media templates (Instagram posts, YouTube thumbnails).
🔹 Retouch & Beauty: Skin smoothing, remove pimples/acne/blemishes, teeth whitening, face reshape (jawline, nose, eyes, eye enhancement).
🔹 AI-Powered Photo Tools: Background remover (AI cutout), object remover (remove unwanted people/things), AI image enhancer (HD/4K quality upscale), sky replacement, face swap / AI avatar generation, blur background (portrait mode).
🔹 Advanced Photo Tools: Layers and masking, selective editing (edit only part of image), blur/vignette/focus effects, double exposure effects.
🔹 Export: Save in HD/4K, adjust file size and format (JPG, PNG), optimize for Instagram, YouTube thumbnails, etc.

🎬 VIDEO EDITING EXPERTISE:
🔹 Basic: Trim, cut, split, merge clips; adjust speed (slow motion / fast forward); rotate and resize video.
🔹 Advanced: Multi-layer timeline editing (video, audio, text, overlays); keyframe animation; color grading (brightness, contrast, saturation, LUTs); transitions (fade, zoom, slide, cinematic); filters and visual effects.
🔹 Audio: Add background music, voiceover recording, noise reduction, audio syncing.
🔹 AI Video Tools: Auto subtitles, background removal (green screen / AI cutout), object tracking, AI auto-edit (create reels/shorts automatically), voice enhancement.
🔹 Export: Change resolution (HD, 4K), adjust frame rate and quality, optimize for YouTube, Instagram, etc.

🧠 BEHAVIOR RULES:
- When user asks to edit a photo or video: First understand their goal → Then suggest the correct tool(s) → Then explain step-by-step how to do it.
- Always adapt based on device: If mobile → suggest apps (CapCut, PicsArt, Snapseed, Lightroom mobile, VN, InShot). If PC → suggest software (Photoshop, Lightroom, Premiere Pro, DaVinci Resolve, After Effects).
- If user says "edit for me" or "what should I do": Describe what edits should be applied, suggest best effects, colors, and adjustments.
- If user is beginner: Use very simple steps, friendly language, no jargon.
- If user is advanced: Give professional tips, shortcuts, and pro-level techniques.
- Can mix a little Hindi/Hinglish if the user does — stay friendly and relatable 😊
- Use bullet points and step-by-step structure for clarity.
- If unsure about something: say honestly instead of guessing.
- Goal: Act like a professional editing expert who knows every tool and can guide any user from beginner to expert to create high-quality, professional content easily.`,
  teacher_course: "You are a Full Course Teacher (Beginner to Expert). Your role is to teach any skill from beginner to expert level, create structured courses lesson-by-lesson, and conduct interactive classes like a real teacher. First, ask the user their level (beginner/intermediate/advanced). Break topics into lessons/modules and teach step-by-step with examples. Give small tasks/practice after each lesson and revise/test user knowledge. If the user says 'start course', begin teaching immediately. If they give timing, act like a scheduled class and continue from the previous lesson automatically. Be patient, supportive, friendly, and explain until the user fully understands. Focus on perfection and clarity. Use simple English and keep answers clear and structured. Answer doubts honestly and never guess if unsure.",
};

const EXPLAIN_LEVELS: Record<string, string> = {
  class1: "IMPORTANT: Explain this for a Class 1-4 student (age 6-9). Use very simple words, short sentences, and fun everyday examples. Avoid all jargon.",
  class5: "IMPORTANT: Explain this for a Class 5-7 student (age 10-12). Use clear simple language with relatable examples and basic concepts.",
  class8: "IMPORTANT: Explain this for a Class 8-10 student (age 13-15). Use clear language, introduce technical terms with explanations, use structured examples.",
  class11: "IMPORTANT: Explain this for a Class 11-12 student (age 16-18). Use proper academic language, include definitions and theory, go deeper into concepts.",
  college: "IMPORTANT: Explain this at a college/university level. Use academic terminology, reference frameworks and theories, provide in-depth analysis.",
  professional: "IMPORTANT: Explain this at a professional/expert level. Use industry terminology, assume advanced knowledge, and provide technical depth and precision.",
};

const GENERATE_MODES: Record<string, string> = {
  blog: "Generate a complete, well-structured blog post based on the following content. Include a catchy title, introduction, sections with headers, and a conclusion.",
  script: "Generate a compelling video/presentation script based on the following content. Include scene descriptions, speaker notes, and engaging narration.",
  notes: "Generate concise, well-organized study notes from the following content. Use bullet points, key terms in bold, and clear summaries.",
  presentation: "Generate a presentation outline with slide titles and bullet points based on the following content. Include speaker notes for each slide.",
  resume: "Create a professional resume based on the following information. Include sections for summary, experience, skills, and education.",
  reel: "Generate a 30-60 second Reel/short video script based on the following. Include: hook (first 3 seconds), main content split into scenes, captions text, and voiceover lines. Make it punchy and engaging.",
};

router.get("/sessions", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
    res.json(sessions.map(s => ({
      id: String(s.id),
      userId: s.userId,
      title: s.title,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error listing sessions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sessions", async (req, res) => {
  const { userId, title } = req.body;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  try {
    const [session] = await db
      .insert(chatSessions)
      .values({ userId, title: title || "New Chat" })
      .returning();
    res.status(201).json({
      id: String(session.id),
      userId: session.userId,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sessions/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }
  try {
    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/messages", async (req, res) => {
  const sessionId = parseInt(req.query.sessionId as string);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }
  try {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
    res.json(msgs.map(m => ({
      id: String(m.id),
      sessionId: String(m.sessionId),
      role: m.role,
      content: m.content,
      attachments: m.attachments || [],
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error listing messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages", async (req, res) => {
  const { sessionId, userId, content, attachments, personality, explainLevel, generateMode } = req.body;
  if (!sessionId || !userId || !content) {
    res.status(400).json({ error: "sessionId, userId, and content are required" });
    return;
  }

  const sessionIdNum = parseInt(sessionId);
  if (isNaN(sessionIdNum)) {
    res.status(400).json({ error: "Invalid sessionId" });
    return;
  }

  try {
    const [userMsg] = await db.insert(chatMessages).values({
      sessionId: sessionIdNum,
      role: "user",
      content,
      attachments: attachments || [],
    }).returning();

    const prevMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionIdNum))
      .orderBy(chatMessages.createdAt);

    const fileContext = attachments && attachments.length > 0
      ? attachments.map((a: { name: string; type: string; extractedContent?: string }) =>
          a.extractedContent ? `[File: ${a.name}]\n${a.extractedContent}` : `[File attached: ${a.name}]`
        ).join("\n\n")
      : "";

    const basePersonality = PERSONALITIES[personality] || PERSONALITIES.default;
    const explainSuffix = explainLevel ? `\n\n${EXPLAIN_LEVELS[explainLevel]}` : "";
    const generateSuffix = generateMode && GENERATE_MODES[generateMode] ? `\n\n${GENERATE_MODES[generateMode]}` : "";

    const systemMessage = `${basePersonality}${explainSuffix}${generateSuffix}\n\nIf a user uploads a file, you can see its contents and help them with it.`;

    const chatHistory = prevMessages.slice(0, -1).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const userContent = fileContext ? `${content}\n\n${fileContext}` : content;

    const imageAttachments = (attachments || []).filter((a: { type: string; url: string }) => a.type.startsWith("image/"));
    let userMessageContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    if (imageAttachments.length > 0) {
      userMessageContent = [
        { type: "text", text: fileContext ? `${content}\n\n${fileContext}` : content },
        ...imageAttachments.map((a: { url: string }) => ({
          type: "image_url",
          image_url: { url: a.url },
        })),
      ];
    } else {
      userMessageContent = userContent;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemMessage },
        ...chatHistory,
        { role: "user", content: userMessageContent as string },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    const [aiMsg] = await db.insert(chatMessages).values({
      sessionId: sessionIdNum,
      role: "assistant",
      content: aiResponse,
      attachments: [],
    }).returning();

    await db.update(chatSessions)
      .set({
        updatedAt: new Date(),
        title: prevMessages.length <= 1 ? content.substring(0, 50) + (content.length > 50 ? "..." : "") : undefined,
      })
      .where(eq(chatSessions.id, sessionIdNum));

    res.json({
      id: String(aiMsg.id),
      sessionId: String(aiMsg.sessionId),
      role: aiMsg.role,
      content: aiMsg.content,
      attachments: aiMsg.attachments || [],
      createdAt: aiMsg.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error sending message");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/homework-check", async (req, res) => {
  const { lessonTitle, homework, studentWork } = req.body;
  if (!lessonTitle || !homework || !studentWork) {
    res.status(400).json({ error: "lessonTitle, homework, and studentWork are required" });
    return;
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are an encouraging, supportive AI teacher checking student homework. Be warm, specific, and constructive. Always find positives first, then suggest improvements. Give a score out of 10. Format your response with clear sections: ✅ What you did well, 💡 Suggestions to improve, 🎯 Score: X/10, 🌟 Final encouragement.",
        },
        {
          role: "user",
          content: `Lesson: ${lessonTitle}\n\nHomework Assignment: ${homework}\n\nStudent's submitted work:\n${studentWork}\n\nPlease grade this homework with specific, encouraging feedback.`,
        },
      ],
    });
    const feedback = completion.choices[0]?.message?.content || "Great effort! Keep it up!";
    res.json({ feedback });
  } catch (err) {
    req.log.error({ err }, "Error checking homework");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
