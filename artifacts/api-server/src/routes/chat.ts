import { Router, type IRouter } from "express";
import { db, chatSessions, chatMessages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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
  const { sessionId, userId, content, attachments } = req.body;
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

    const systemMessage = `You are a helpful, knowledgeable AI assistant. You can answer questions on any topic, help with coding, writing, analysis, math, and more. Be helpful, clear, and concise. If a user uploads a file, you can see its contents and help them with it.`;

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
