import { Router, type IRouter } from "express";
import { openai, editImages } from "@workspace/integrations-openai-ai-server";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const router: IRouter = Router();

router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }
  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    const b64 = response.data[0]?.b64_json;
    if (!b64) throw new Error("No image generated");
    res.json({ b64_json: b64 });
  } catch (err: any) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

router.post("/edit-image", async (req, res) => {
  const { imageBase64, instruction } = req.body;
  if (!imageBase64 || !instruction) {
    res.status(400).json({ error: "imageBase64 and instruction are required" });
    return;
  }
  const tmpPath = join(tmpdir(), `edit_${Date.now()}.png`);
  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    writeFileSync(tmpPath, imageBuffer);
    const prompt = `${instruction}. Make the result look completely natural and realistic. High quality, seamless result.`;
    const resultBuffer = await editImages([tmpPath], prompt);
    const resultBase64 = resultBuffer.toString("base64");
    res.json({ resultBase64 });
  } catch (err: any) {
    req.log.error({ err }, "Image edit error");
    res.status(500).json({ error: err.message || "Image edit failed" });
  } finally {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  }
});

export default router;
