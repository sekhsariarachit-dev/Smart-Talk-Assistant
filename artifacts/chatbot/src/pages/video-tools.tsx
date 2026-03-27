import React, { useState, useRef } from "react";
import { Download, Upload, Film, Loader2, Scissors, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "trim" | "mute";

export default function VideoTools() {
  const [tab, setTab] = useState<Tab>("trim");
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-14 border-b flex items-center px-4 gap-3 shrink-0">
        <Film size={20} />
        <h1 className="font-bold text-lg">Video Tools</h1>
      </header>
      <div className="flex border-b shrink-0">
        {(["trim", "mute"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-3 text-xs font-medium transition-colors border-b-2",
              tab === t ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black")}>
            {t === "trim" ? "✂️ Trim" : "🔇 Remove Audio"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "trim" && <TrimTab />}
        {tab === "mute" && <MuteTab />}
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function TrimTab() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setResultUrl(null);
    setStatus("");
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      setStartTime(0);
      setEndTime(d);
    }
  };

  const trimVideo = async () => {
    if (!videoRef.current || !videoFile) return;
    setLoading(true);
    setResultUrl(null);
    const clipDuration = endTime - startTime;
    setStatus(`Recording ${formatTime(clipDuration)} clip — please wait...`);

    try {
      const video = document.createElement("video");
      video.src = videoUrl!;
      video.muted = false;
      video.preload = "auto";

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = reject;
        video.load();
      });

      video.currentTime = startTime;
      const stream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream?.();

      if (!stream) {
        setStatus("⚠️ Your browser doesn't support video trimming. Try Chrome on desktop.");
        setLoading(false);
        return;
      }

      const chunks: Blob[] = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setResultUrl(URL.createObjectURL(blob));
        setStatus("Trim done! ✅");
        setLoading(false);
      };

      video.currentTime = startTime;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      recorder.start(100);
      video.play();

      setTimeout(() => {
        recorder.stop();
        video.pause();
      }, clipDuration * 1000);

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 1;
        if (elapsed < clipDuration) {
          setStatus(`Recording... ${formatTime(elapsed)} / ${formatTime(clipDuration)}`);
        } else {
          clearInterval(interval);
        }
      }, 1000);

    } catch (err: any) {
      setStatus("Could not trim. Try Chrome on desktop.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
        ✂️ Upload a video, set the start and end time, then click Trim to get your clip.
        <br /><span className="text-blue-500">Note: Works best on Chrome/Edge on desktop.</span>
      </div>

      <label className={cn("flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer hover:border-black transition-colors", loading && "pointer-events-none opacity-50")}>
        {videoUrl
          ? <video ref={videoRef} src={videoUrl} controls className="w-full rounded-xl max-h-48" onLoadedMetadata={handleLoadedMetadata} />
          : <><Upload size={28} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500 font-medium">Upload a video</span><span className="text-xs text-gray-400">MP4, MOV, WEBM, AVI…</span></>}
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={loading} />
      </label>

      {videoUrl && duration > 0 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Start: <strong className="text-black">{formatTime(startTime)}</strong></span>
                <span>Duration: <strong className="text-black">{formatTime(endTime - startTime)}</strong></span>
              </div>
              <input type="range" min={0} max={duration} step={0.1} value={startTime}
                onChange={e => { const v = parseFloat(e.target.value); if (v < endTime) setStartTime(v); }}
                className="w-full accent-black" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>End: <strong className="text-black">{formatTime(endTime)}</strong></span>
                <span>Total: <strong className="text-black">{formatTime(duration)}</strong></span>
              </div>
              <input type="range" min={0} max={duration} step={0.1} value={endTime}
                onChange={e => { const v = parseFloat(e.target.value); if (v > startTime) setEndTime(v); }}
                className="w-full accent-black" />
            </div>
          </div>

          <button onClick={trimVideo} disabled={loading || endTime - startTime < 0.5}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" />{status}</> : <><Scissors size={18} />Trim Video</>}
          </button>

          {status && !loading && (
            <p className={cn("text-sm font-medium text-center", status.includes("✅") ? "text-green-600" : "text-red-500")}>{status}</p>
          )}

          {resultUrl && (
            <div className="space-y-3">
              <video src={resultUrl} controls className="w-full rounded-xl border" />
              <a href={resultUrl} download="trimmed-video.webm"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
                <Download size={16} />Download Trimmed Video
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MuteTab() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setStatus("");
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const removeAudio = async () => {
    if (!videoRef.current || !videoUrl) return;
    setLoading(true);
    setStatus(`Removing audio — recording ${formatTime(duration)}...`);
    setResultUrl(null);

    try {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.muted = true;
      video.preload = "auto";

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = reject;
        video.load();
      });

      const stream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream?.();

      if (!stream) {
        setStatus("⚠️ Your browser doesn't support this. Try Chrome on desktop.");
        setLoading(false);
        return;
      }

      const videoOnlyStream = new MediaStream(stream.getVideoTracks());
      const chunks: Blob[] = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(videoOnlyStream, { mimeType });

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setResultUrl(URL.createObjectURL(blob));
        setStatus("Audio removed! ✅");
        setLoading(false);
      };

      video.currentTime = 0;
      await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });

      recorder.start(100);
      video.play();

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 1;
        if (elapsed < duration) {
          setStatus(`Processing... ${formatTime(elapsed)} / ${formatTime(duration)}`);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      setTimeout(() => {
        recorder.stop();
        video.pause();
        clearInterval(interval);
      }, duration * 1000 + 500);

    } catch (err) {
      setStatus("Could not remove audio. Try Chrome on desktop.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 font-medium">
        🔇 Upload a video and get a version with audio completely removed.
        <br /><span className="text-purple-500">Note: Works best on Chrome/Edge on desktop.</span>
      </div>

      <label className={cn("flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer hover:border-black transition-colors", loading && "pointer-events-none opacity-50")}>
        {videoUrl
          ? <video ref={videoRef} src={videoUrl} controls className="w-full rounded-xl max-h-48" onLoadedMetadata={handleLoadedMetadata} />
          : <><Upload size={28} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500 font-medium">Upload a video</span><span className="text-xs text-gray-400">MP4, MOV, WEBM, AVI…</span></>}
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={loading} />
      </label>

      {videoUrl && duration > 0 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <VolumeX size={18} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium">Remove all audio</p>
              <p className="text-xs text-gray-500">Duration: {formatTime(duration)}</p>
            </div>
          </div>

          <button onClick={removeAudio} disabled={loading}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" />{status}</> : <><VolumeX size={18} />Remove Audio</>}
          </button>

          {status && !loading && (
            <p className={cn("text-sm font-medium text-center", status.includes("✅") ? "text-green-600" : "text-red-500")}>{status}</p>
          )}

          {resultUrl && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                <VolumeX size={16} className="text-green-600" />
                <span className="text-sm text-green-700 font-medium">Audio removed successfully</span>
              </div>
              <video src={resultUrl} controls muted className="w-full rounded-xl border" />
              <a href={resultUrl} download="muted-video.webm"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black font-semibold rounded-xl hover:bg-gray-50">
                <Download size={16} />Download Muted Video
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
