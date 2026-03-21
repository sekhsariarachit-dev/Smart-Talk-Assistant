import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): string {
  if (mimeType === "text/plain" || filename.endsWith(".txt") || filename.endsWith(".md")) {
    return buffer.toString("utf-8").substring(0, 10000);
  }
  if (mimeType === "application/json" || filename.endsWith(".json")) {
    try {
      const parsed = JSON.parse(buffer.toString("utf-8"));
      return JSON.stringify(parsed, null, 2).substring(0, 10000);
    } catch {
      return buffer.toString("utf-8").substring(0, 10000);
    }
  }
  if (mimeType === "text/csv" || filename.endsWith(".csv")) {
    return buffer.toString("utf-8").substring(0, 10000);
  }
  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf-8").substring(0, 10000);
  }
  return "";
}

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { originalname, mimetype, buffer } = req.file;

  const extractedContent = extractTextFromBuffer(buffer, mimetype, originalname);

  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimetype};base64,${base64}`;

  res.json({
    url: dataUrl,
    name: originalname,
    type: mimetype,
    extractedContent: extractedContent || undefined,
  });
});

export default router;
