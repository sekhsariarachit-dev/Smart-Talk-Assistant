import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import filesRouter from "./files";
import ttsRouter from "./tts";
import notesRouter from "./notes";
import toolsRouter from "./tools";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/files", filesRouter);
router.use("/tts", ttsRouter);
router.use("/session", notesRouter);
router.use("/tools", toolsRouter);

export default router;
