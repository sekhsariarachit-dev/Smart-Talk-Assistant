import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    const url = response.data[0]?.url;
    if (!url) throw new Error("No image generated");
    res.json({ url });
  } catch (err: any) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

export default router;
