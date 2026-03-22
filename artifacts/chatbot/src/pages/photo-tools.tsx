import React, { useState, useRef, useCallback } from "react";
import { Sparkles, Download, Upload, Wand2, ImageIcon, Loader2, X } from "lucide-react";
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
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              tab === t ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
            )}
          >
            {t === "generate" ? "Generate Image" : t === "edit" ? "Edit Photo" : "Remove Background"}
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

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setImageUrl(null);
    try {
      const res = await fetch("/api/tools/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Failed to generate image");
      const data = await res.json();
      setImageUrl(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Describe the image you want</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="A futuristic city skyline at night with neon lights..."
          rows={4}
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-black focus:outline-none resize-none"
        />
      </div>
      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Wand2 size={18} /> Generate Image</>}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {imageUrl && (
        <div className="space-y-3">
          <img src={imageUrl} alt="Generated" className="w-full rounded-2xl border shadow-lg" />
          <a
            href={imageUrl}
            download="generated-image.png"
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <Download size={16} /> Download
          </a>
        </div>
      )}
    </div>
  );
}

function EditTab() {
  const [original, setOriginal] = useState<string | null>(null);
  const [edited, setEdited] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginal(url);
    setEdited(null);
    const img = new Image();
    img.onload = () => { imgRef.current = img; applyEdits(img, 100, 100, 100, 0); };
    img.src = url;
  };

  const applyEdits = useCallback((img: HTMLImageElement, br: number, co: number, sa: number, rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rad = (rot * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    canvas.width = img.width * cos + img.height * sin;
    canvas.height = img.width * sin + img.height * cos;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = `brightness(${br}%) contrast(${co}%) saturate(${sa}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    setEdited(canvas.toDataURL("image/png"));
  }, []);

  const apply = () => {
    if (imgRef.current) applyEdits(imgRef.current, brightness, contrast, saturation, rotation);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-black transition-colors">
        <Upload size={28} className="text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 font-medium">Upload a photo to edit</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </label>
      {original && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
              { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
              { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label} {value}%</label>
                <input type="range" min={min} max={max} value={value} onChange={e => set(Number(e.target.value))} className="w-full" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rotation {rotation}°</label>
            <input type="range" min={-180} max={180} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full" />
          </div>
          <button onClick={apply} className="w-full py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all">
            Apply Edits
          </button>
          <canvas ref={canvasRef} className="hidden" />
          {edited && (
            <>
              <img src={edited} alt="Edited" className="w-full rounded-2xl border shadow" />
              <a href={edited} download="edited-photo.png" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50 transition-all">
                <Download size={16} /> Download
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RemoveBgTab() {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null); setError("");
    const url = URL.createObjectURL(file);
    setOriginal(url);
    setLoading(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/",
      });
      const resultUrl = URL.createObjectURL(blob);
      setResult(resultUrl);
    } catch (e: any) {
      setError("Background removal failed. Please try a different image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
        Upload a photo and the AI will automatically remove the background, leaving a transparent PNG.
      </div>
      <label className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-colors",
        loading ? "border-gray-200 cursor-not-allowed" : "border-gray-300 cursor-pointer hover:border-black"
      )}>
        {loading ? (
          <><Loader2 size={28} className="animate-spin text-gray-400 mb-2" /><span className="text-sm text-gray-500">Removing background...</span></>
        ) : (
          <><Upload size={28} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500 font-medium">Upload photo to remove background</span></>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
      </label>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
      {original && result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Original</p>
              <img src={original} alt="Original" className="w-full rounded-xl border" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Result</p>
              <div className="w-full rounded-xl border overflow-hidden" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e5e7eb'/%3E%3C/svg%3E\")" }}>
                <img src={result} alt="No background" className="w-full" />
              </div>
            </div>
          </div>
          <a href={result} download="no-background.png" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50 transition-all">
            <Download size={16} /> Download PNG
          </a>
        </div>
      )}
    </div>
  );
}
