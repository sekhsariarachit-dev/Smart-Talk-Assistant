import React, { useState, useRef } from "react";
import { Download, Upload, Wand2, ImageIcon, Loader2, Send, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "generate" | "edit" | "removebg";

export default function PhotoTools() {
  const [tab, setTab] = useState<Tab>("generate");
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
        <ImageIcon size={20} />
        <h1 className="font-bold text-lg">Photo Tools</h1>
      </header>
      <div className="flex border-b shrink-0">
        {(["generate", "edit", "removebg"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-3 text-xs font-medium transition-colors border-b-2",
              tab === t ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black")}>
            {t === "generate" ? "Generate" : t === "edit" ? "AI Edit" : "Remove BG"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "generate" && <GenerateTab />}
        {tab === "edit" && <EditTab />}
        {tab === "removebg" && <RemoveBgTab />}
      </div>
    </div>
  );
}

function GenerateTab() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    setLoading(true); setError(""); setImageUrl(null);
    try {
      const res = await fetch("/api/tools/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      if (data.b64_json) {
        setImageUrl(`data:image/png;base64,${data.b64_json}`);
      } else {
        throw new Error("No image returned");
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setError("Generation timed out. Please try again.");
      } else {
        setError("Image generation failed. Please try again in a moment.");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="Describe the image you want... e.g. 'A sunset over mountains, photorealistic, 4K'"
        rows={4} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-black focus:outline-none resize-none" />
      <button onClick={generate} disabled={loading || !prompt.trim()}
        className="w-full py-3 bg-black text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
        {loading
          ? <><Loader2 size={18} className="animate-spin" />Generating — this can take 30–60 seconds...</>
          : <><Wand2 size={18} />Generate Image</>}
      </button>
      {loading && (
        <p className="text-xs text-center text-gray-400">AI is creating your image. Please wait, don't close the page.</p>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {imageUrl && (
        <div className="space-y-3">
          <img src={imageUrl} alt="Generated" className="w-full rounded-2xl border shadow-lg" />
          <a href={imageUrl} download="generated.png"
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
            <Download size={16} />Download
          </a>
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File, maxDim = 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) resolve(new File([blob], "image.png", { type: "image/png" }));
        else reject(new Error("compress failed"));
      }, "image/png", 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function fileToBase64(file: File): Promise<string> {
  const compressed = file.size > 1.5 * 1024 * 1024 ? await compressImage(file) : file;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.replace(/^data:[^;]+;base64,/, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });
}

function EditTab() {
  const [mainImg, setMainImg] = useState<string | null>(null);
  const [overlayImg, setOverlayImg] = useState<string | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const mainImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainFile(file);
    const url = URL.createObjectURL(file);
    setMainImg(url);
    setResult(null); setStatus("");
    const img = new Image();
    img.onload = () => { mainImgRef.current = img; };
    img.src = url;
  };

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOverlayFile(file);
    setOverlayImg(URL.createObjectURL(file));
  };

  const callBackendEdit = async (base64: string, prompt: string, endpoint = "/api/tools/edit-image") => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    try {
      const body = endpoint.includes("remove-bg")
        ? JSON.stringify({ imageBase64: base64 })
        : JSON.stringify({ imageBase64: base64, instruction: prompt });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI edit failed");
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const applyEdit = async () => {
    if (!mainImgRef.current || !instruction.trim()) return;
    const lower = instruction.toLowerCase();
    setLoading(true); setResult(null); setStatus("Processing...");
    try {
      const isBackground = lower.includes("background") || lower.includes("remove bg") || lower.includes("transparent");
      const isRemoval = !isBackground && (
        lower.includes("remove") || lower.includes("erase") || lower.includes("delete") ||
        lower.includes("cut out") || lower.includes("clean up") || lower.includes("get rid of")
      );
      const isAddOverlay = (lower.includes("add") || lower.includes("put") || lower.includes("place")) && overlayFile;
      const isFilterOnly =
        (lower.includes("bright") || lower.includes("dark") || lower.includes("contrast") ||
         lower.includes("saturate") || lower.includes("vivid") || lower.includes("colorful") ||
         lower.includes("black and white") || lower.includes("bw") || lower.includes("grayscale") ||
         lower.includes("monochrome") || lower.includes("rotate") || lower.includes("flip") ||
         lower.includes("sepia") || lower.includes("vintage") || lower.includes("warm") || lower.includes("mirror")) &&
        !isRemoval && !isBackground && !isAddOverlay;

      if (isBackground) {
        setStatus("Sending to AI — removing background... (30–90 seconds)");
        const base64 = await fileToBase64(mainFile!);
        const data = await callBackendEdit(base64, "", "/api/tools/remove-bg");
        setResult(`data:image/png;base64,${data.resultBase64}`);
        setStatus("Background removed! ✅");
      } else if (isRemoval) {
        setStatus("AI is analysing your image — this can take 30–90 seconds...");
        const canvas = document.createElement("canvas");
        const img = mainImgRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
        const data = await callBackendEdit(base64, instruction);
        setResult(`data:image/png;base64,${data.resultBase64}`);
        setStatus("Done! ✅");
      } else if (isAddOverlay) {
        const canvas = canvasRef.current!;
        const main = mainImgRef.current;
        canvas.width = main.naturalWidth;
        canvas.height = main.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(main, 0, 0);
        const overlay = new Image();
        overlay.onload = () => {
          const scale = Math.min(0.3, (main.naturalWidth * 0.3) / overlay.naturalWidth);
          const w = overlay.naturalWidth * scale;
          const h = overlay.naturalHeight * scale;
          let x = 0, y = 0;
          if (lower.includes("top-right") || lower.includes("top right")) { x = main.naturalWidth - w - 10; y = 10; }
          else if (lower.includes("bottom-left") || lower.includes("bottom left")) { x = 10; y = main.naturalHeight - h - 10; }
          else if (lower.includes("bottom-right") || lower.includes("bottom right")) { x = main.naturalWidth - w - 10; y = main.naturalHeight - h - 10; }
          else if (lower.includes("center") || lower.includes("middle")) { x = (main.naturalWidth - w) / 2; y = (main.naturalHeight - h) / 2; }
          else { x = 10; y = 10; }
          ctx.drawImage(overlay, x, y, w, h);
          setResult(canvas.toDataURL("image/png"));
          setStatus("Element added! ✅");
          setLoading(false);
        };
        overlay.src = overlayImg!;
        return;
      } else if (isFilterOnly) {
        const canvas = canvasRef.current!;
        const img = mainImgRef.current;
        let br = 100, co = 100, sa = 100, rotation = 0;
        let flipX = false, flipY = false;

        if (lower.includes("bright") || lower.includes("lighter") || lower.includes("light")) br = 145;
        if (lower.includes("dark") || lower.includes("darker")) br = 65;
        if (lower.includes("contrast")) co = 160;
        if (lower.includes("vivid") || lower.includes("saturate") || lower.includes("colorful")) sa = 185;
        if (lower.includes("black and white") || lower.includes("bw") || lower.includes("grayscale") || lower.includes("monochrome")) sa = 0;
        if (lower.includes("rotate 90") || lower.includes("rotate right") || lower.includes("clockwise")) rotation = 90;
        if (lower.includes("rotate 180") || lower.includes("upside down")) rotation = 180;
        if (lower.includes("rotate left") || lower.includes("counter")) rotation = -90;
        if (lower.includes("flip horizontal") || lower.includes("mirror")) flipX = true;
        if (lower.includes("flip vertical")) flipY = true;
        if (lower.includes("sepia") || lower.includes("vintage") || lower.includes("warm")) { br = 110; co = 115; sa = 60; }

        const rad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
        canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;
        const ctx = canvas.getContext("2d")!;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (flipX) ctx.scale(-1, 1);
        if (flipY) ctx.scale(1, -1);
        ctx.rotate(rad);
        ctx.filter = `brightness(${br}%) contrast(${co}%) saturate(${sa}%)`;
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.restore();
        setResult(canvas.toDataURL("image/png"));
        setStatus("Edit applied! ✅");
      } else {
        setStatus("AI is editing your image — this can take 30–90 seconds...");
        const base64 = await fileToBase64(mainFile!);
        const data = await callBackendEdit(base64, instruction);
        setResult(`data:image/png;base64,${data.resultBase64}`);
        setStatus("Done! ✅");
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setStatus("Timed out. Please try again — AI edits can take up to 90 seconds.");
      } else {
        setStatus("Could not process. Try: 'remove centre person', 'make brighter', 'rotate 90°', 'black and white'");
      }
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = ["Remove centre person", "Remove person on left", "Remove person on right", "Remove background", "Make it brighter", "Black and white", "Rotate 90°", "Vintage/sepia look"];

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
        📝 Upload a photo and type what you want to do — e.g. "remove background", "make brighter", "rotate 90°", "black and white"
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-black transition-colors">
        {mainImg
          ? <img src={mainImg} className="max-h-48 rounded-xl object-contain" />
          : <><Upload size={28} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500 font-medium">Upload any photo</span><span className="text-xs text-gray-400">(JPG, PNG, WEBP, HEIC, etc.)</span></>
        }
        <input type="file" accept="image/*" className="hidden" onChange={handleMainUpload} />
      </label>

      {mainImg && (
        <>
          <div className="border border-dashed border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">➕ Optionally upload an element to add to the photo:</p>
            <label className="flex items-center gap-2 cursor-pointer">
              {overlayImg
                ? <><img src={overlayImg} className="h-10 w-10 rounded-lg object-cover border" /><span className="text-xs text-gray-600">Element uploaded</span><button onClick={() => { setOverlayImg(null); setOverlayFile(null); }} className="ml-auto"><X size={14} className="text-gray-400" /></button></>
                : <><Plus size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Upload element to add (logo, sticker, text image...)</span></>
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleOverlayUpload} />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setInstruction(s)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-black hover:text-white text-gray-700 text-xs rounded-full transition-all font-medium">
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && applyEdit()}
              placeholder="Type what you want to do..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-black focus:outline-none"
            />
            <button onClick={applyEdit} disabled={loading || !instruction.trim()}
              className="px-4 py-2.5 bg-black text-white rounded-xl disabled:opacity-40 flex items-center gap-1.5 font-medium">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {status && (
            <p className={cn("text-sm font-medium", status.includes("✅") ? "text-green-600" : status.includes("Could not") || status.includes("Timed out") ? "text-red-500" : "text-blue-600")}>
              {loading && <Loader2 size={14} className="inline animate-spin mr-1" />}{status}
            </p>
          )}
          {loading && (
            <p className="text-xs text-center text-gray-400">Please wait and don't close the page. AI edits can take 30–90 seconds.</p>
          )}

          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs font-medium text-gray-500 mb-1">Original</p><img src={mainImg} className="w-full rounded-xl border object-cover h-32" /></div>
                <div><p className="text-xs font-medium text-gray-500 mb-1">Result</p>
                  <div className="w-full rounded-xl border h-32 overflow-hidden" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e5e7eb'/%3E%3C/svg%3E\")" }}>
                    <img src={result} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <a href={result} download="edited-photo.png"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
                <Download size={16} />Download Result
              </a>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}
    </div>
  );
}

function RemoveBgTab() {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [fileCache, setFileCache] = useState<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const process = async (file: File) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    setResult(null);
    setLoading(true);
    setStatus("Compressing image...");
    try {
      const base64 = await fileToBase64(file);
      setStatus("AI is removing background — please wait 30–90 seconds...");
      const res = await fetch("/api/tools/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      setResult(`data:image/png;base64,${data.resultBase64}`);
      setStatus("Done! ✅");
    } catch (e: any) {
      if (e.name === "AbortError") {
        setStatus("Timed out — please try again with a smaller image.");
      } else {
        setStatus("error");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileCache(file);
    setOriginal(URL.createObjectURL(file));
    await process(file);
  };

  const retry = async () => {
    if (fileCache) await process(fileCache);
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
        Upload <strong>any photo</strong> (JPG, PNG, WEBP, HEIC…) — AI removes the background and gives you a transparent PNG. Works best on clear subjects with contrasting backgrounds.
      </div>

      <label className={cn("flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-colors",
        loading ? "border-gray-200 cursor-not-allowed" : "border-gray-300 cursor-pointer hover:border-black")}>
        {loading
          ? <><Loader2 size={28} className="animate-spin text-black mb-2" /><span className="text-sm font-medium">{status}</span><span className="text-xs text-gray-400 mt-1">Please wait, don't close the page</span></>
          : <><Upload size={28} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500 font-medium">Upload any photo</span><span className="text-xs text-gray-400">Tap to choose from your gallery</span></>
        }
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
      </label>

      {!loading && status === "error" && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="text-orange-700 text-sm font-semibold">Something went wrong — please try again</p>
          <p className="text-orange-500 text-xs">Try with a smaller or simpler image if the issue persists.</p>
          <button onClick={retry} className="w-full py-2 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800">
            Try Again
          </button>
        </div>
      )}
      {!loading && status.includes("Timed out") && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
          <p className="text-orange-700 text-sm font-semibold">Timed out — AI is busy</p>
          <p className="text-orange-500 text-xs">Please try again in a moment or use a smaller image.</p>
          <button onClick={retry} className="w-full py-2 bg-black text-white font-semibold rounded-xl text-sm hover:bg-gray-800">
            Try Again
          </button>
        </div>
      )}

      {original && result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs font-medium text-gray-500 mb-1">Original</p><img src={original} className="w-full rounded-xl border" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">No Background</p>
              <div className="w-full rounded-xl border overflow-hidden" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e5e7eb'/%3E%3C/svg%3E\")" }}>
                <img src={result} className="w-full" />
              </div>
            </div>
          </div>
          <a href={result} download="no-background.png"
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
            <Download size={16} />Download Transparent PNG
          </a>
        </div>
      )}
    </div>
  );
}
