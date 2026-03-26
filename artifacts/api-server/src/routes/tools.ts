import { Router, type IRouter } from "express";
import { openai, editImages, generateImageBuffer } from "@workspace/integrations-openai-ai-server";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const router: IRouter = Router();

router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }
  try {
    const buffer = await generateImageBuffer(prompt, "1024x1024");
    res.json({ b64_json: buffer.toString("base64") });
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
    res.json({ resultBase64: resultBuffer.toString("base64") });
  } catch (err: any) {
    req.log.error({ err }, "Image edit error");
    res.status(500).json({ error: err.message || "Image edit failed" });
  } finally {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  }
});

router.post("/remove-bg", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) { res.status(400).json({ error: "imageBase64 is required" }); return; }
  const tmpPath = join(tmpdir(), `rmbg_${Date.now()}.png`);
  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    writeFileSync(tmpPath, imageBuffer);
    const resultBuffer = await editImages(
      [tmpPath],
      "Remove the background completely and make it fully transparent. Keep only the main subject. No background at all."
    );
    res.json({ resultBase64: resultBuffer.toString("base64") });
  } catch (err: any) {
    req.log.error({ err }, "Remove BG error");
    res.status(500).json({ error: err.message || "Background removal failed" });
  } finally {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  }
});

export default router;
