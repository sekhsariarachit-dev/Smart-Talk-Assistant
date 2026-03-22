import React, { useState, useRef, useEffect } from "react";
import { Film, Upload, Download, Scissors, EyeOff, Loader2 } from "lucide-react";
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
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
              tab === t ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
            )}
          >
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
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setEndTime(d);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleTrim = async () => {
    if (!videoFile) return;
    setLoading(true); setResult(null);
    try {
      setProgress("Loading video processor...");
      const ffmpeg = await getFFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => setProgress(`Processing: ${Math.round(p * 100)}%`));
      setProgress("Reading video file...");
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
      setProgress("Trimming video...");
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", String(startTime),
        "-to", String(endTime),
        "-c:v", "copy",
        "-c:a", "copy",
        "output.mp4"
      ]);
      const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
      const blob = new Blob([data], { type: "video/mp4" });
      setResult(URL.createObjectURL(blob));
      setProgress("");
    } catch (e) {
      setProgress("Error processing video. Please try a smaller file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
        Upload a video, set the start and end times, and download the trimmed clip. The original quality is preserved.
      </div>
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start: {fmt(startTime)}</label>
                <input type="range" min={0} max={duration} step={0.1} value={startTime} onChange={e => setStartTime(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End: {fmt(endTime)}</label>
                <input type="range" min={0} max={duration} step={0.1} value={endTime} onChange={e => setEndTime(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 text-center">Clip duration: {fmt(Math.max(0, endTime - startTime))}</p>
          <button onClick={handleTrim} disabled={loading || endTime <= startTime} className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {progress}</> : <><Scissors size={18} /> Trim Video</>}
          </button>
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <video src={result} controls className="w-full rounded-xl border bg-black" />
          <a href={result} download="trimmed-video.mp4" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50 transition-all">
            <Download size={16} /> Download Trimmed Video
          </a>
        </div>
      )}
    </div>
  );
}

function WatermarkTab() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [region, setRegion] = useState({ x: 10, y: 10, w: 200, h: 80 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
  };

  const handleRemove = async () => {
    if (!videoFile) return;
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
      const blob = new Blob([data], { type: "video/mp4" });
      setResult(URL.createObjectURL(blob));
      setProgress("");
    } catch {
      setProgress("Error processing video. Try a smaller file or different region.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
        Upload a video, specify where the watermark is located (in pixels), and the tool will remove it using the delogo algorithm.
      </div>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-black transition-colors">
        <Upload size={28} className="text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 font-medium">Upload video with watermark</span>
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      </label>
      {videoSrc && (
        <div className="space-y-4">
          <video ref={videoRef} src={videoSrc} controls className="w-full rounded-xl border bg-black" />
          <p className="text-xs font-medium text-gray-700">Watermark region (in pixels from top-left):</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "X (left)", key: "x" as const },
              { label: "Y (top)", key: "y" as const },
              { label: "Width", key: "w" as const },
              { label: "Height", key: "h" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input
                  type="number"
                  value={region[key]}
                  onChange={e => setRegion(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none"
                />
              </div>
            ))}
          </div>
          <button onClick={handleRemove} disabled={loading} className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {progress}</> : <><EyeOff size={18} /> Remove Watermark</>}
          </button>
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <video src={result} controls className="w-full rounded-xl border bg-black" />
          <a href={result} download="no-watermark.mp4" className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50 transition-all">
            <Download size={16} /> Download Video
          </a>
        </div>
      )}
    </div>
  );
}
