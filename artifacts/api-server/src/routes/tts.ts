import { Router, type IRouter } from "express";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

router.post("/speak", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    const audioBuffer = await textToSpeech(text.substring(0, 4096), "alloy", "mp3");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.end(audioBuffer);
  } catch (err) {
    req.log.error({ err }, "Error generating TTS");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
