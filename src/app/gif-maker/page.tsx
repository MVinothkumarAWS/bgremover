"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSharedImage } from "@/context/SharedImageContext";

interface FrameItem {
  id: string;
  file: File;
  url: string;
  img: HTMLImageElement;
}

const OUTPUT_SIZES = [
  { label: "Original", value: 0 },
  { label: "320px", value: 320 },
  { label: "480px", value: 480 },
  { label: "640px", value: 640 },
  { label: "800px", value: 800 },
];

let idCounter = 0;
function nextId() {
  return `frame-${++idCounter}-${Date.now()}`;
}

function loadImageFromFile(file: File): Promise<{ url: string; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, img });
    img.onerror = reject;
    img.src = url;
  });
}

export default function GifMakerPage() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [delay, setDelay] = useState(500);
  const [loop, setLoop] = useState(true);
  const [outputSize, setOutputSize] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const { sharedFile, setSharedImage } = useSharedImage();

  const inputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playCountRef = useRef(0);

  // Load multiple image files into frames
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArr.length === 0) return;
    setSharedImage(fileArr[0]);

    const newFrames: FrameItem[] = [];
    for (const file of fileArr) {
      try {
        const { url, img } = await loadImageFromFile(file);
        newFrames.push({ id: nextId(), file, url, img });
      } catch {
        // skip unloadable files
      }
    }
    setFrames((prev) => [...prev, ...newFrames]);
  }, []);

  useEffect(() => {
    if (sharedFile && frames.length === 0) addFiles([sharedFile]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag and drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleInitialInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
    },
    [addFiles]
  );

  const handleAddMore = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      if (addInputRef.current) addInputRef.current.value = "";
    },
    [addFiles]
  );

  // Frame reorder
  const moveFrame = useCallback((index: number, direction: -1 | 1) => {
    setFrames((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  // Remove frame
  const removeFrame = useCallback((id: string) => {
    setFrames((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      return updated;
    });
  }, []);

  // Animation playback
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!playing || frames.length < 2) return;

    playCountRef.current = 0;
    let frameIdx = 0;

    intervalRef.current = setInterval(() => {
      frameIdx = (frameIdx + 1) % frames.length;
      if (frameIdx === 0) {
        playCountRef.current += 1;
        if (!loop && playCountRef.current >= 1) {
          setPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
      }
      setCurrentFrame(frameIdx);
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, frames.length, delay, loop]);

  // Keep currentFrame in bounds
  useEffect(() => {
    if (frames.length === 0) {
      setCurrentFrame(0);
    } else if (currentFrame >= frames.length) {
      setCurrentFrame(frames.length - 1);
    }
  }, [frames.length, currentFrame]);

  // Draw current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;
    const frame = frames[currentFrame];
    if (!frame) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = frame.img;
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (outputSize > 0 && w > outputSize) {
      const ratio = outputSize / w;
      w = outputSize;
      h = Math.round(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  }, [currentFrame, frames, outputSize]);

  // Download individual frame as PNG
  const downloadFrame = useCallback(
    (index: number) => {
      const frame = frames[index];
      if (!frame) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let w = frame.img.naturalWidth;
      let h = frame.img.naturalHeight;
      if (outputSize > 0 && w > outputSize) {
        const ratio = outputSize / w;
        w = outputSize;
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(frame.img, 0, 0, w, h);

      const link = document.createElement("a");
      link.download = `frame-${index + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },
    [frames, outputSize]
  );

  // Download all frames as PNGs
  const downloadAllFrames = useCallback(async () => {
    if (frames.length === 0) return;
    setDownloading(true);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      let w = frame.img.naturalWidth;
      let h = frame.img.naturalHeight;
      if (outputSize > 0 && w > outputSize) {
        const ratio = outputSize / w;
        w = outputSize;
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(frame.img, 0, 0, w, h);

      const link = document.createElement("a");
      link.download = `gif-frame-${String(i + 1).padStart(3, "0")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Small delay between downloads so browser doesn't block them
      await new Promise((r) => setTimeout(r, 200));
    }
    setDownloading(false);
  }, [frames, outputSize]);

  // Record canvas as WebM video
  const downloadAsWebM = useCallback(async () => {
    if (frames.length < 2) return;
    setDownloading(true);

    try {
      const offscreen = document.createElement("canvas");
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      // Determine size from first frame
      const first = frames[0].img;
      let w = first.naturalWidth;
      let h = first.naturalHeight;
      if (outputSize > 0 && w > outputSize) {
        const ratio = outputSize / w;
        w = outputSize;
        h = Math.round(h * ratio);
      }
      offscreen.width = w;
      offscreen.height = h;

      // Check MediaRecorder support
      if (typeof MediaRecorder === "undefined") {
        alert("Your browser does not support MediaRecorder. Please use Chrome or Firefox.");
        setDownloading(false);
        return;
      }

      const stream = offscreen.captureStream(0);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const totalCycles = loop ? 3 : 1; // record 3 loops for infinite, 1 for play-once

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.start();

        let frameIdx = 0;
        let cycles = 0;

        const drawNext = () => {
          const frame = frames[frameIdx];
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(frame.img, 0, 0, w, h);

          // Request a frame from the capture stream
          const track = stream.getVideoTracks()[0];
          if (track && "requestFrame" in track) {
            (track as unknown as { requestFrame: () => void }).requestFrame();
          }

          frameIdx++;
          if (frameIdx >= frames.length) {
            frameIdx = 0;
            cycles++;
          }

          if (cycles >= totalCycles) {
            setTimeout(() => recorder.stop(), delay);
          } else {
            setTimeout(drawNext, delay);
          }
        };

        drawNext();
      });

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "animation.webm";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("WebM recording failed:", err);
      alert("WebM export failed. Try downloading individual frames instead.");
    } finally {
      setDownloading(false);
    }
  }, [frames, outputSize, delay, loop]);

  const handleReset = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFrames([]);
    setCurrentFrame(0);
    setPlaying(true);
    setDelay(500);
    setLoop(true);
    setOutputSize(0);
    if (inputRef.current) inputRef.current.value = "";
  }, [frames]);

  const hasEnoughFrames = frames.length >= 2;

  return (
    <>
      <Header />
      <main className="flex-1">
        {frames.length === 0 ? (
          /* ===================== HERO / UPLOAD ZONE ===================== */
          <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 py-20 sm:py-28">
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative mx-auto max-w-3xl px-4 text-center">
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                GIF Maker
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-lg text-violet-100/90">
                Upload multiple images, arrange your frames, set timing and
                preview your animation instantly. Everything runs in your
                browser.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`group mx-auto max-w-lg cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all ${
                  dragActive
                    ? "border-white bg-white/20 scale-[1.02]"
                    : "border-white/40 bg-white/10 hover:border-white/70 hover:bg-white/15"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleInitialInput}
                />
                <svg
                  className="mx-auto mb-4 h-14 w-14 text-white/80 transition-transform group-hover:scale-110"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-8m0 0l-3 3m3-3l3 3M6.75 19.25h10.5A2.25 2.25 0 0019.5 17V7A2.25 2.25 0 0017.25 4.75H6.75A2.25 2.25 0 004.5 7v10a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <p className="text-lg font-semibold text-white">
                  Drop images here or click to upload
                </p>
                <p className="mt-1 text-sm text-violet-200/70">
                  Select at least 2 images &middot; PNG, JPG, WebP supported
                </p>
              </div>
            </div>
          </section>
        ) : (
          /* ===================== GIF BUILDER ===================== */
          <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 min-h-screen py-10">
            <div className="mx-auto max-w-7xl px-4">
              {/* Top bar */}
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  GIF Maker
                </h1>
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition"
                >
                  Start Over
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Preview */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Animation Preview */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">
                        Preview
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          Frame {currentFrame + 1} / {frames.length}
                        </span>
                        <button
                          onClick={() => setPlaying(!playing)}
                          disabled={frames.length < 2}
                          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-40"
                        >
                          {playing ? "Pause" : "Play"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-black/30 p-4 min-h-[300px]">
                      {frames.length > 0 ? (
                        <canvas
                          ref={canvasRef}
                          className="max-w-full max-h-[500px] rounded-lg"
                          style={{ imageRendering: "auto" }}
                        />
                      ) : (
                        <p className="text-gray-500">No frames loaded</p>
                      )}
                    </div>
                    {!hasEnoughFrames && (
                      <p className="mt-3 text-center text-sm text-amber-400">
                        Add at least 2 frames to see the animation
                      </p>
                    )}
                  </div>

                  {/* Frame List */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">
                        Frames ({frames.length})
                      </h2>
                      <button
                        onClick={() => addInputRef.current?.click()}
                        className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition"
                      >
                        + Add Frames
                      </button>
                      <input
                        ref={addInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAddMore}
                      />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {frames.map((frame, idx) => (
                        <div
                          key={frame.id}
                          className={`flex items-center gap-3 rounded-xl p-2.5 transition ${
                            idx === currentFrame
                              ? "bg-violet-600/20 border border-violet-500/30"
                              : "bg-white/5 border border-transparent hover:bg-white/10"
                          }`}
                        >
                          {/* Thumbnail */}
                          <img
                            src={frame.url}
                            alt={`Frame ${idx + 1}`}
                            className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              Frame {idx + 1}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {frame.file.name}
                            </p>
                          </div>

                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveFrame(idx, -1)}
                              disabled={idx === 0}
                              className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                              title="Move up"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveFrame(idx, 1)}
                              disabled={idx === frames.length - 1}
                              className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                              title="Move down"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Download single frame */}
                          <button
                            onClick={() => downloadFrame(idx)}
                            className="rounded-lg p-2 text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 transition"
                            title="Download this frame"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => removeFrame(frame.id)}
                            className="rounded-lg p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remove frame"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="space-y-6">
                  {/* Frame Delay */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                      Frame Delay
                    </h3>
                    <input
                      type="range"
                      min={50}
                      max={2000}
                      step={50}
                      value={delay}
                      onChange={(e) => setDelay(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>50ms (fast)</span>
                      <span className="text-violet-300 font-medium">
                        {delay}ms
                      </span>
                      <span>2000ms (slow)</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {(1000 / delay).toFixed(1)} frames per second
                    </p>
                  </div>

                  {/* Loop Toggle */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                      Playback
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        {loop ? "Infinite Loop" : "Play Once"}
                      </span>
                      <button
                        onClick={() => setLoop(!loop)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          loop ? "bg-violet-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            loop ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Output Size */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                      Output Size
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {OUTPUT_SIZES.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => setOutputSize(size.value)}
                          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                            outputSize === size.value
                              ? "bg-violet-600 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Width is capped; aspect ratio is maintained.
                    </p>
                  </div>

                  {/* Download Options */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                    <h3 className="text-sm font-semibold text-white mb-4">
                      Download
                    </h3>

                    <button
                      onClick={downloadAllFrames}
                      disabled={!hasEnoughFrames || downloading}
                      className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {downloading
                        ? "Downloading..."
                        : `Download All Frames as PNG (${frames.length})`}
                    </button>

                    <button
                      onClick={downloadAsWebM}
                      disabled={!hasEnoughFrames || downloading}
                      className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {downloading
                        ? "Recording..."
                        : "Export as Animated WebM"}
                    </button>

                    <p className="text-xs text-gray-500 leading-relaxed">
                      PNG download saves each frame individually. WebM export
                      records the animation as a video using your browser&apos;s
                      MediaRecorder API.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section (always visible below) */}
        <section className="bg-gray-950 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold text-white mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  title: "Upload Frames",
                  desc: "Select multiple images to use as animation frames. PNG, JPG, and WebP are all supported.",
                  icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
                {
                  title: "Arrange & Configure",
                  desc: "Reorder frames, set the delay between them, choose your output size, and preview the animation live.",
                  icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
                },
                {
                  title: "Download",
                  desc: "Download individual frames as PNG or export the entire animation as a WebM video file.",
                  icon: "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={step.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
