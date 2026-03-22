import { Router, type IRouter } from "express";
import { db, sessionNotes, sessionTasks } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notes/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
  try {
    const notes = await db.select().from(sessionNotes).where(eq(sessionNotes.sessionId, sessionId));
    if (notes.length === 0) {
      res.json({ id: null, sessionId, content: "", updatedAt: new Date().toISOString() });
    } else {
      const n = notes[0];
      res.json({ id: n.id, sessionId: n.sessionId, content: n.content, updatedAt: n.updatedAt.toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notes/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
  const { content } = req.body;
  try {
    const existing = await db.select().from(sessionNotes).where(eq(sessionNotes.sessionId, sessionId));
    if (existing.length === 0) {
      const [n] = await db.insert(sessionNotes).values({ sessionId, content: content || "" }).returning();
      res.json({ id: n.id, sessionId: n.sessionId, content: n.content, updatedAt: n.updatedAt.toISOString() });
    } else {
      const [n] = await db.update(sessionNotes).set({ content: content || "", updatedAt: new Date() }).where(eq(sessionNotes.sessionId, sessionId)).returning();
      res.json({ id: n.id, sessionId: n.sessionId, content: n.content, updatedAt: n.updatedAt.toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
  try {
    const tasks = await db.select().from(sessionTasks).where(eq(sessionTasks.sessionId, sessionId)).orderBy(asc(sessionTasks.createdAt));
    res.json(tasks.map(t => ({ id: t.id, sessionId: t.sessionId, title: t.title, completed: t.completed, createdAt: t.createdAt.toISOString() })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks/:sessionId", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) { res.status(400).json({ error: "Invalid sessionId" }); return; }
  const { title } = req.body;
  if (!title) { res.status(400).json({ error: "title is required" }); return; }
  try {
    const [t] = await db.insert(sessionTasks).values({ sessionId, title }).returning();
    res.status(201).json({ id: t.id, sessionId: t.sessionId, title: t.title, completed: t.completed, createdAt: t.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/tasks/:taskId", async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid taskId" }); return; }
  const { completed, title } = req.body;
  try {
    const updates: any = {};
    if (typeof completed === "boolean") updates.completed = completed;
    if (title) updates.title = title;
    const [t] = await db.update(sessionTasks).set(updates).where(eq(sessionTasks.id, taskId)).returning();
    res.json({ id: t.id, sessionId: t.sessionId, title: t.title, completed: t.completed, createdAt: t.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:taskId", async (req, res) => {
  const taskId = parseInt(req.params.taskId);
  if (isNaN(taskId)) { res.status(400).json({ error: "Invalid taskId" }); return; }
  try {
    await db.delete(sessionTasks).where(eq(sessionTasks.id, taskId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
