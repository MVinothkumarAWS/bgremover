"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FONT_FAMILIES = ["Impact", "Arial Black", "Comic Sans MS", "Courier"];
const TEXT_ALIGNMENTS = ["left", "center", "right"] as const;
type TextAlign = (typeof TEXT_ALIGNMENTS)[number];

export default function MemeGeneratorPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontFamily, setFontFamily] = useState("Impact");
  const [textAlign, setTextAlign] = useState<TextAlign>("center");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  // Draw meme on canvas whenever inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.drawImage(image, 0, 0);

    // Configure text style
    ctx.font = `bold ${fontSize * (image.naturalWidth / 500)}px "${fontFamily}"`;
    ctx.fillStyle = textColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth * (image.naturalWidth / 500);
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    const alignMap: Record<TextAlign, CanvasTextAlign> = {
      left: "left",
      center: "center",
      right: "right",
    };
    ctx.textAlign = alignMap[textAlign];

    const paddingX = image.naturalWidth * 0.05;
    let xPos: number;
    if (textAlign === "left") {
      xPos = paddingX;
    } else if (textAlign === "right") {
      xPos = image.naturalWidth - paddingX;
    } else {
      xPos = image.naturalWidth / 2;
    }

    const maxWidth = image.naturalWidth - paddingX * 2;

    const drawText = (text: string, y: number, fromBottom: boolean) => {
      if (!text) return;
      const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
      const lineHeight = fontSize * (image.naturalWidth / 500) * 1.15;

      lines.forEach((line, i) => {
        let lineY: number;
        if (fromBottom) {
          lineY = y - (lines.length - 1 - i) * lineHeight;
        } else {
          lineY = y + i * lineHeight;
        }
        ctx.strokeText(line, xPos, lineY);
        ctx.fillText(line, xPos, lineY);
      });
    };

    // Top text
    ctx.textBaseline = "top";
    drawText(topText, image.naturalHeight * 0.04, false);

    // Bottom text
    ctx.textBaseline = "bottom";
    drawText(bottomText, image.naturalHeight * 0.96, true);
  }, [
    image,
    topText,
    bottomText,
    fontSize,
    textColor,
    strokeColor,
    strokeWidth,
    fontFamily,
    textAlign,
  ]);

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const name = imageName ? imageName.replace(/\.[^.]+$/, "") : "meme";
    link.download = `${name}-meme.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setImage(null);
    setImageName("");
    setTopText("");
    setBottomText("");
    setFontSize(48);
    setTextColor("#ffffff");
    setStrokeColor("#000000");
    setStrokeWidth(3);
    setFontFamily("Impact");
    setTextAlign("center");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero / Upload Zone */}
        {!image ? (
          <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 py-20 sm:py-28">
            {/* Decorative background blobs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative mx-auto max-w-3xl px-4 text-center">
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Meme Generator
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-lg text-violet-100/90">
                Upload an image, add your top and bottom text, and create
                classic memes in seconds. Everything runs in your browser.
              </p>

              {/* Drop zone */}
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
                  className="hidden"
                  onChange={handleInputChange}
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
                  Drop your image here or click to upload
                </p>
                <p className="mt-1 text-sm text-violet-200/70">
                  PNG, JPG, WebP supported
                </p>
              </div>
            </div>
          </section>
        ) : (
          /* Meme Editor */
          <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 min-h-screen py-10">
            <div className="mx-auto max-w-7xl px-4">
              {/* Top bar */}
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Meme Editor
                </h1>
                <button
                  onClick={handleReset}
                  className="rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  New Image
                </button>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* Canvas Preview */}
                <div className="flex items-start justify-center">
                  <div className="w-full overflow-hidden rounded-2xl bg-black/40 p-2 shadow-2xl ring-1 ring-white/10">
                    <canvas
                      ref={canvasRef}
                      className="h-auto w-full rounded-xl"
                    />
                  </div>
                </div>

                {/* Controls Panel */}
                <div className="space-y-5">
                  {/* Text Inputs */}
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300">
                      Text
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Top Text
                        </label>
                        <input
                          type="text"
                          value={topText}
                          onChange={(e) => setTopText(e.target.value)}
                          placeholder="TOP TEXT"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Bottom Text
                        </label>
                        <input
                          type="text"
                          value={bottomText}
                          onChange={(e) => setBottomText(e.target.value)}
                          placeholder="BOTTOM TEXT"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font & Alignment */}
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300">
                      Font &amp; Alignment
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Font Family
                        </label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        >
                          {FONT_FAMILIES.map((f) => (
                            <option
                              key={f}
                              value={f}
                              className="bg-gray-900 text-white"
                            >
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Text Alignment
                        </label>
                        <div className="flex gap-2">
                          {TEXT_ALIGNMENTS.map((a) => (
                            <button
                              key={a}
                              onClick={() => setTextAlign(a)}
                              className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium capitalize transition ${
                                textAlign === a
                                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Size & Colors */}
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-300">
                      Style
                    </h2>
                    <div className="space-y-4">
                      {/* Font size */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-400">
                            Font Size
                          </label>
                          <span className="text-xs tabular-nums text-violet-300">
                            {fontSize}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full accent-violet-500"
                        />
                      </div>

                      {/* Stroke width */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-400">
                            Stroke Width
                          </label>
                          <span className="text-xs tabular-nums text-violet-300">
                            {strokeWidth}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={strokeWidth}
                          onChange={(e) =>
                            setStrokeWidth(Number(e.target.value))
                          }
                          className="w-full accent-violet-500"
                        />
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400">
                            Text Color
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                            />
                            <span className="text-xs text-gray-400">
                              {textColor}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-400">
                            Stroke Color
                          </label>
                          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <input
                              type="color"
                              value={strokeColor}
                              onChange={(e) => setStrokeColor(e.target.value)}
                              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                            />
                            <span className="text-xs text-gray-400">
                              {strokeColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 active:scale-[0.98]"
                  >
                    Download Meme (PNG)
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
