import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

async function extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv")) {
    return buffer.toString("utf-8").substring(0, 15000);
  }

  if (mimeType === "application/json" || lower.endsWith(".json")) {
    try {
      const parsed = JSON.parse(buffer.toString("utf-8"));
      return JSON.stringify(parsed, null, 2).substring(0, 15000);
    } catch {
      return buffer.toString("utf-8").substring(0, 15000);
    }
  }

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text.substring(0, 15000);
    } catch (err) {
      console.error("PDF parse error:", err);
      return "[Could not extract PDF text]";
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.substring(0, 15000);
    } catch (err) {
      console.error("Word parse error:", err);
      return "[Could not extract Word document text]";
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls")
  ) {
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let text = "";
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}\n\n`;
      }
      return text.substring(0, 15000);
    } catch (err) {
      console.error("Excel parse error:", err);
      return "[Could not extract Excel content]";
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lower.endsWith(".pptx") ||
    lower.endsWith(".ppt")
  ) {
    try {
      const officeParser = await import("officeparser");
      const text = await officeParser.parseOfficeAsync(buffer, { outputErrorToConsole: false } as any);
      return (text as string).substring(0, 15000);
    } catch (err) {
      console.error("PowerPoint parse error:", err);
      return "[Could not extract PowerPoint content]";
    }
  }

  if (lower.endsWith(".doc")) {
    try {
      const officeParser = await import("officeparser");
      const text = await officeParser.parseOfficeAsync(buffer, { outputErrorToConsole: false } as any);
      return (text as string).substring(0, 15000);
    } catch {
      return "[Could not extract .doc content — try saving as .docx]";
    }
  }

  return "";
}

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { originalname, mimetype, buffer } = req.file;

  const extractedContent = await extractTextFromBuffer(buffer, mimetype, originalname);

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
