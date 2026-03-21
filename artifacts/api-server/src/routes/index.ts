import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import filesRouter from "./files";
import ttsRouter from "./tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/files", filesRouter);
router.use("/tts", ttsRouter);

export default router;
