"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface LayoutPreset {
  label: string;
  cols: number;
  rows: number;
}

interface CanvasSizePreset {
  label: string;
  width: number;
  height: number;
}

const LAYOUT_PRESETS: LayoutPreset[] = [
  { label: "2 × 1", cols: 2, rows: 1 },
  { label: "1 × 2", cols: 1, rows: 2 },
  { label: "2 × 2", cols: 2, rows: 2 },
  { label: "3 × 3", cols: 3, rows: 3 },
  { label: "2 × 3", cols: 2, rows: 3 },
  { label: "3 × 2", cols: 3, rows: 2 },
  { label: "1 × 3", cols: 1, rows: 3 },
  { label: "3 × 1", cols: 3, rows: 1 },
];

const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { label: "Square", width: 1080, height: 1080 },
  { label: "Landscape", width: 1920, height: 1080 },
  { label: "Portrait", width: 1080, height: 1920 },
  { label: "Instagram", width: 1080, height: 1080 },
  { label: "Facebook Cover", width: 820, height: 312 },
];

/* ------------------------------------------------------------------ */
/*  Helper: draw an image into a rect with "cover" behaviour           */
/* ------------------------------------------------------------------ */

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const cellRatio = w / h;

  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;

  if (imgRatio > cellRatio) {
    // image is wider → crop sides
    sw = img.naturalHeight * cellRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // image is taller → crop top/bottom
    sh = img.naturalWidth / cellRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function CollagePage() {
  /* ---- images ---- */
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- collage settings ---- */
  const [layout, setLayout] = useState<LayoutPreset>(LAYOUT_PRESETS[2]); // 2x2
  const [gap, setGap] = useState(6);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [canvasSize, setCanvasSize] = useState<CanvasSizePreset>(
    CANVAS_SIZE_PRESETS[0]
  );
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg">("png");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Image loading                                                    */
  /* ---------------------------------------------------------------- */

  const loadImages = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    fileArr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setImages((prev) => [...prev, img]);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length) loadImages(e.dataTransfer.files);
    },
    [loadImages]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) loadImages(e.target.files);
    },
    [loadImages]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Draw collage on canvas                                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvasSize.width;
    const H = canvasSize.height;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const { cols, rows } = layout;
    const totalCells = cols * rows;

    const cellW = (W - gap * (cols + 1)) / cols;
    const cellH = (H - gap * (rows + 1)) / rows;

    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = gap + col * (cellW + gap);
      const y = gap + row * (cellH + gap);

      // Border / gap colour behind each cell
      ctx.fillStyle = borderColor;
      ctx.fillRect(x - gap / 2, y - gap / 2, cellW + gap, cellH + gap);

      if (images.length > 0) {
        const imgIndex = i % images.length; // repeat if fewer images
        const img = images[imgIndex];
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, cellW, cellH);
          ctx.clip();
          drawCover(ctx, img, x, y, cellW, cellH);
          ctx.restore();
        }
      }
    }
  }, [images, layout, gap, borderColor, bgColor, canvasSize]);

  /* ---------------------------------------------------------------- */
  /*  Download                                                         */
  /* ---------------------------------------------------------------- */

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mimeType = downloadFormat === "jpg" ? "image/jpeg" : "image/png";
    const ext = downloadFormat === "jpg" ? "jpg" : "png";
    const link = document.createElement("a");
    link.download = `collage.${ext}`;
    link.href = canvas.toDataURL(mimeType, 0.92);
    link.click();
  }, [downloadFormat]);

  /* ---------------------------------------------------------------- */
  /*  Ready state                                                      */
  /* ---------------------------------------------------------------- */

  const ready = images.length >= 2;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Photo Collage Maker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Combine multiple photos into beautiful collages. Choose a layout,
            customise borders and colours, then download your creation.
          </p>
        </section>

        {/* Upload zone */}
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={`relative mx-auto max-w-2xl rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
              : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <svg
            className="mx-auto h-12 w-12 text-violet-500"
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
          <p className="mt-3 font-semibold text-violet-600 dark:text-violet-400">
            Drop images here or click to upload
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Upload at least 2 images to get started
          </p>
        </div>

        {/* Thumbnails of uploaded images */}
        {images.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.src}
                  alt={`Upload ${i + 1}`}
                  className="h-20 w-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove image ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-2xl text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
              aria-label="Add more images"
            >
              +
            </button>
          </div>
        )}

        {/* Collage builder */}
        {ready && (
          <div className="mt-12 grid lg:grid-cols-[340px_1fr] gap-8">
            {/* Sidebar controls */}
            <aside className="space-y-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 h-fit">
              {/* Layout presets */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Layout
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {LAYOUT_PRESETS.map((lp) => (
                    <button
                      key={lp.label}
                      onClick={() => setLayout(lp)}
                      className={`rounded-xl border-2 p-2 text-xs font-medium transition-colors ${
                        layout.label === lp.label
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
                          : "border-gray-200 dark:border-gray-700 hover:border-violet-300"
                      }`}
                    >
                      {/* Mini grid preview */}
                      <div
                        className="grid gap-0.5 mx-auto mb-1"
                        style={{
                          gridTemplateColumns: `repeat(${lp.cols}, 1fr)`,
                          gridTemplateRows: `repeat(${lp.rows}, 1fr)`,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {Array.from({ length: lp.cols * lp.rows }).map(
                          (_, idx) => (
                            <div
                              key={idx}
                              className={`rounded-sm ${
                                layout.label === lp.label
                                  ? "bg-violet-400"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                          )
                        )}
                      </div>
                      {lp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas size */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Canvas Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CANVAS_SIZE_PRESETS.map((cs) => (
                    <button
                      key={cs.label}
                      onClick={() => setCanvasSize(cs)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        canvasSize.label === cs.label
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {cs.label}
                      <span className="block text-[10px] opacity-70">
                        {cs.width}&times;{cs.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border / gap width */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Border / Gap Width{" "}
                  <span className="text-violet-500 font-bold">{gap}px</span>
                </h3>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

              {/* Border colour */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Border Colour
                </label>
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="h-8 w-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Background colour */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Background
                </label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Download */}
              <div className="pt-2 space-y-3">
                <div className="flex gap-2">
                  {(["png", "jpg"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setDownloadFormat(fmt)}
                      className={`flex-1 rounded-lg py-1.5 text-sm font-medium uppercase transition-colors ${
                        downloadFormat === fmt
                          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-2 border-violet-500"
                          : "bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 transition-all shadow-lg shadow-violet-500/25"
                >
                  Download Collage
                </button>
              </div>
            </aside>

            {/* Canvas preview */}
            <div className="flex items-start justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-800 w-full overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="mx-auto rounded-xl max-w-full h-auto"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Informational section */}
        <section className="mt-20 max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            {[
              {
                title: "1. Upload Photos",
                desc: "Drag and drop or click to add at least two images.",
              },
              {
                title: "2. Pick a Layout",
                desc: "Choose from 8 grid presets and adjust borders and colours.",
              },
              {
                title: "3. Download",
                desc: "Export your collage as a high-quality PNG or JPG.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow border border-gray-100 dark:border-gray-800"
              >
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
