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
};

const EXPLAIN_LEVELS: Record<string, string> = {
  child: "IMPORTANT: Explain this like the user is 5 years old. Use very simple words, fun analogies, and short sentences. Avoid all jargon.",
  student: "IMPORTANT: Explain this at a student level — clear, educational, with examples. Not too technical but thorough.",
  expert: "IMPORTANT: Explain this at an expert level — use technical terminology, go deep, assume advanced knowledge.",
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

export default router;
