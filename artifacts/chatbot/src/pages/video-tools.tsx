import React, { useState, useRef } from "react";
import { Film, Upload, Download, Scissors, EyeOff, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type Tab = "trim" | "watermark";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpegInstance = ffmpeg;
  ffmpegLoaded = true;
  return ffmpeg;
}

export default function VideoTools() {
  const [tab, setTab] = useState<Tab>("trim");
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
        <Film size={20} />
        <h1 className="font-bold text-lg">Video Tools</h1>
      </header>
      <div className="flex border-b shrink-0">
        {(["trim", "watermark"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              tab === t ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black")}>
            {t === "trim" ? "Trim / Remove Clip" : "Remove Watermark"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "trim" && <TrimTab />}
        {tab === "watermark" && <WatermarkTab />}
      </div>
    </div>
  );
}

function TrimTab() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setEndTime(d);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const handleTrim = async () => {
    if (!videoFile) return;
    setLoading(true); setResult(null);
    try {
      setProgress("Loading video processor...");
      const ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => setProgress(`Processing: ${Math.round(p * 100)}%`));
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
      setProgress("Trimming...");
      await ffmpeg.exec(["-i", "input.mp4", "-ss", String(startTime), "-to", String(endTime), "-c:v", "copy", "-c:a", "copy", "output.mp4"]);
      const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
      setResult(URL.createObjectURL(new Blob([data], { type: "video/mp4" })));
      setProgress("");
    } catch { setProgress("Error processing video. Try a smaller file."); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">Upload a video, set start and end times, and download the trimmed clip.</div>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-black transition-colors">
        <Upload size={28} className="text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 font-medium">Upload video (MP4, WebM, MOV)</span>
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </label>
      {videoSrc && (
        <div className="space-y-4">
          <video ref={videoRef} src={videoSrc} controls className="w-full rounded-xl border bg-black" onLoadedMetadata={handleLoadedMetadata} />
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {[{ label: "Start", value: startTime, set: setStartTime }, { label: "End", value: endTime, set: setEndTime }].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}: {fmt(value)}</label>
                  <input type="range" min={0} max={duration} step={0.1} value={value} onChange={e => set(Number(e.target.value))} className="w-full" />
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 text-center">Clip: {fmt(Math.max(0, endTime - startTime))}</p>
          <button onClick={handleTrim} disabled={loading || endTime <= startTime}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" />{progress}</> : <><Scissors size={18} />Trim Video</>}
          </button>
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <video src={result} controls className="w-full rounded-xl border bg-black" />
          <a href={result} download="trimmed.mp4" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
            <Download size={16} />Download Trimmed Video
          </a>
        </div>
      )}
    </div>
  );
}

type Position = "top-left" | "top-center" | "top-right" | "mid-left" | "center" | "mid-right" | "bot-left" | "bot-center" | "bot-right";
type WSize = "small" | "medium" | "large" | "banner";

const POSITION_GRID: { id: Position; label: string }[][] = [
  [{ id: "top-left", label: "↖" }, { id: "top-center", label: "↑" }, { id: "top-right", label: "↗" }],
  [{ id: "mid-left", label: "←" }, { id: "center", label: "·" }, { id: "mid-right", label: "→" }],
  [{ id: "bot-left", label: "↙" }, { id: "bot-center", label: "↓" }, { id: "bot-right", label: "↘" }],
];

function computeRegion(pos: Position, size: WSize, vw: number, vh: number) {
  const sizeMap: Record<WSize, [number, number]> = {
    small: [Math.round(vw * 0.15), Math.round(vh * 0.1)],
    medium: [Math.round(vw * 0.25), Math.round(vh * 0.15)],
    large: [Math.round(vw * 0.35), Math.round(vh * 0.2)],
    banner: [vw, Math.round(vh * 0.12)],
  };
  const [w, h] = sizeMap[size];
  const pad = 8;
  const cx = Math.round((vw - w) / 2);
  const cy = Math.round((vh - h) / 2);
  const xMap: Record<Position, number> = {
    "top-left": pad, "top-center": cx, "top-right": vw - w - pad,
    "mid-left": pad, center: cx, "mid-right": vw - w - pad,
    "bot-left": pad, "bot-center": cx, "bot-right": vw - w - pad,
  };
  const yMap: Record<Position, number> = {
    "top-left": pad, "top-center": pad, "top-right": pad,
    "mid-left": cy, center: cy, "mid-right": cy,
    "bot-left": vh - h - pad, "bot-center": vh - h - pad, "bot-right": vh - h - pad,
  };
  return { x: Math.max(0, xMap[pos]), y: Math.max(0, yMap[pos]), w, h };
}

function parseInstruction(text: string, vw: number, vh: number): { x: number; y: number; w: number; h: number } | null {
  const lower = text.toLowerCase();
  let pos: Position = "top-left";
  let size: WSize = "medium";

  if (lower.includes("top-left") || lower.includes("top left") || lower.includes("upper left")) pos = "top-left";
  else if (lower.includes("top-right") || lower.includes("top right") || lower.includes("upper right")) pos = "top-right";
  else if (lower.includes("top center") || lower.includes("top middle") || lower.includes("top")) pos = "top-center";
  else if (lower.includes("bottom-left") || lower.includes("bottom left") || lower.includes("lower left")) pos = "bot-left";
  else if (lower.includes("bottom-right") || lower.includes("bottom right") || lower.includes("lower right")) pos = "bot-right";
  else if (lower.includes("bottom center") || lower.includes("bottom middle") || lower.includes("bottom") || lower.includes("footer")) pos = "bot-center";
  else if (lower.includes("center") || lower.includes("middle")) pos = "center";
  else if (lower.includes("left")) pos = "mid-left";
  else if (lower.includes("right")) pos = "mid-right";

  if (lower.includes("banner") || lower.includes("full width") || lower.includes("strip")) size = "banner";
  else if (lower.includes("large") || lower.includes("big")) size = "large";
  else if (lower.includes("small") || lower.includes("tiny") || lower.includes("little")) size = "small";

  return computeRegion(pos, size, vw, vh);
}

function WatermarkTab() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>("top-left");
  const [wSize, setWSize] = useState<WSize>("medium");
  const [instruction, setInstruction] = useState("");
  const [videoDims, setVideoDims] = useState({ w: 1280, h: 720 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null); setProgress("");
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDims({ w: videoRef.current.videoWidth || 1280, h: videoRef.current.videoHeight || 720 });
    }
  };

  const handleRemove = async () => {
    if (!videoFile) return;
    let region: { x: number; y: number; w: number; h: number };
    if (instruction.trim()) {
      const parsed = parseInstruction(instruction, videoDims.w, videoDims.h);
      region = parsed || computeRegion(position, wSize, videoDims.w, videoDims.h);
    } else {
      region = computeRegion(position, wSize, videoDims.w, videoDims.h);
    }

    setLoading(true); setResult(null);
    try {
      setProgress("Loading video processor...");
      const ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => setProgress(`Processing: ${Math.round(p * 100)}%`));
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
      setProgress("Removing watermark...");
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-vf", `delogo=x=${region.x}:y=${region.y}:w=${region.w}:h=${region.h}`,
        "-c:a", "copy",
        "output.mp4"
      ]);
      const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
      setResult(URL.createObjectURL(new Blob([data], { type: "video/mp4" })));
      setProgress("");
    } catch {
      setProgress("Error processing. Try a smaller file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
        📝 Upload your video, then either <strong>type where the watermark is</strong> (e.g. "remove top-left logo") or select its position manually below.
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-black transition-colors">
        <Upload size={28} className="text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 font-medium">Upload video (MP4, WebM, MOV)</span>
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </label>

      {videoSrc && (
        <video ref={videoRef} src={videoSrc} controls className="w-full rounded-xl border bg-black" onLoadedMetadata={handleVideoLoaded} />
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Tell AI what to remove (optional):</label>
        <div className="flex gap-2">
          <input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder='e.g. "remove top-right watermark" or "bottom banner logo"'
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Top-left logo", "Top-right logo", "Bottom banner", "Bottom-left logo", "Bottom-right logo", "Center logo"].map(s => (
            <button key={s} onClick={() => setInstruction(s)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-black hover:text-white text-gray-700 text-xs rounded-full transition-all">
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Or select position manually:</label>
        <div className="grid grid-cols-3 gap-1.5 w-40">
          {POSITION_GRID.map((row, ri) => row.map(({ id, label }) => (
            <button key={id} onClick={() => setPosition(id)}
              className={cn("h-10 rounded-xl text-lg font-bold transition-all border-2",
                position === id ? "bg-black text-white border-black" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400")}>
              {label}
            </button>
          )))}
        </div>
        <div className="flex gap-2 mt-3">
          {(["small", "medium", "large", "banner"] as WSize[]).map(s => (
            <button key={s} onClick={() => setWSize(s)}
              className={cn("flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all border-2",
                wSize === s ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400")}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {videoSrc && (
        <button onClick={handleRemove} disabled={loading}
          className="w-full py-3 bg-black text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={18} className="animate-spin" />{progress}</> : <><EyeOff size={18} />Remove Watermark</>}
        </button>
      )}

      {result && (
        <div className="space-y-3">
          <video src={result} controls className="w-full rounded-xl border bg-black" />
          <a href={result} download="no-watermark.mp4"
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
            <Download size={16} />Download Video
          </a>
        </div>
      )}
    </div>
  );
}
