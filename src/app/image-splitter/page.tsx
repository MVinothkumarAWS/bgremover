"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface GridPreset {
  label: string;
  rows: number;
  cols: number;
}

interface SplitPiece {
  index: number;
  row: number;
  col: number;
  dataUrl: string;
}

const GRID_PRESETS: GridPreset[] = [
  { label: "2\u00d72", rows: 2, cols: 2 },
  { label: "3\u00d73", rows: 3, cols: 3 },
  { label: "4\u00d74", rows: 4, cols: 4 },
  { label: "2\u00d71", rows: 2, cols: 1 },
  { label: "1\u00d72", rows: 1, cols: 2 },
  { label: "3\u00d71", rows: 3, cols: 1 },
  { label: "1\u00d73", rows: 1, cols: 3 },
  { label: "2\u00d73", rows: 2, cols: 3 },
  { label: "3\u00d72", rows: 3, cols: 2 },
];

export default function ImageSplitterPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("image");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [activePreset, setActivePreset] = useState<string>("3\u00d73");
  const [pieces, setPieces] = useState<SplitPiece[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    setFileName(baseName);
    setPieces([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => setImageEl(img);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const selectPreset = (preset: GridPreset) => {
    setRows(preset.rows);
    setCols(preset.cols);
    setActivePreset(preset.label);
    setPieces([]);
  };

  const handleRowsChange = (val: number) => {
    const clamped = Math.max(1, Math.min(10, val));
    setRows(clamped);
    setActivePreset("");
    setPieces([]);
  };

  const handleColsChange = (val: number) => {
    const clamped = Math.max(1, Math.min(10, val));
    setCols(clamped);
    setActivePreset("");
    setPieces([]);
  };

  const splitImage = useCallback(() => {
    if (!imageEl) return;
    setSplitting(true);
    setPieces([]);

    const natW = imageEl.naturalWidth;
    const natH = imageEl.naturalHeight;
    const pieceW = Math.floor(natW / cols);
    const pieceH = Math.floor(natH / rows);

    const results: SplitPiece[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const canvas = document.createElement("canvas");
        canvas.width = pieceW;
        canvas.height = pieceH;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
          imageEl,
          c * pieceW,
          r * pieceH,
          pieceW,
          pieceH,
          0,
          0,
          pieceW,
          pieceH
        );
        results.push({
          index: r * cols + c + 1,
          row: r,
          col: c,
          dataUrl: canvas.toDataURL("image/png"),
        });
      }
    }

    setPieces(results);
    setSplitting(false);
  }, [imageEl, rows, cols]);

  const downloadPiece = (piece: SplitPiece) => {
    const a = document.createElement("a");
    a.href = piece.dataUrl;
    a.download = `${fileName}_part${piece.index}.png`;
    a.click();
  };

  const downloadAll = () => {
    pieces.forEach((piece, i) => {
      setTimeout(() => downloadPiece(piece), i * 150);
    });
  };

  const reset = () => {
    setImageSrc(null);
    setImageEl(null);
    setPieces([]);
    setFileName("image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Image Splitter
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Split Images Into{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Perfect Pieces
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Divide any image into a customizable grid. Perfect for Instagram carousels, puzzle pieces, and multi-panel designs. 100% client-side.
          </p>
        </div>

        {/* Use case labels */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {["Perfect for Instagram carousel", "Create puzzle pieces", "Multi-panel wall art", "Grid collages"].map(
            (label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {label}
              </span>
            )
          )}
        </div>

        {/* Upload Zone */}
        {!imageSrc && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative mx-auto max-w-2xl rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragOver
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 scale-[1.02]"
                : "border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-gray-800/50 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-1">Drop your image here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse. Supports PNG, JPG, WebP, and more.
            </p>
          </div>
        )}

        {/* Splitter Interface */}
        {imageSrc && imageEl && (
          <div className="space-y-8">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold">Grid Settings</h2>
                <button
                  onClick={reset}
                  className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Image
                </button>
              </div>

              {/* Presets */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRID_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => selectPreset(preset)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activePreset === preset.label
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rows (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rows}
                    onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-end pb-2 text-gray-400 font-bold text-lg">{"\u00d7"}</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Columns (1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={cols}
                    onChange={(e) => handleColsChange(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    = {rows * cols} pieces ({Math.floor(imageEl.naturalWidth / cols)}{"\u00d7"}{Math.floor(imageEl.naturalHeight / rows)}px each)
                  </span>
                </div>
              </div>
            </div>

            {/* Preview with grid overlay */}
            <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Preview</h2>
              <div className="relative inline-block mx-auto w-full max-w-3xl">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="w-full h-auto rounded-xl"
                  />
                  {/* Grid overlay */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    {/* Row lines */}
                    {Array.from({ length: rows - 1 }, (_, i) => (
                      <div
                        key={`row-${i}`}
                        className="absolute left-0 right-0 h-[2px] bg-violet-500/70"
                        style={{ top: `${((i + 1) / rows) * 100}%` }}
                      />
                    ))}
                    {/* Column lines */}
                    {Array.from({ length: cols - 1 }, (_, i) => (
                      <div
                        key={`col-${i}`}
                        className="absolute top-0 bottom-0 w-[2px] bg-violet-500/70"
                        style={{ left: `${((i + 1) / cols) * 100}%` }}
                      />
                    ))}
                    {/* Section numbers */}
                    {Array.from({ length: rows }, (_, r) =>
                      Array.from({ length: cols }, (_, c) => {
                        const num = r * cols + c + 1;
                        return (
                          <div
                            key={`num-${r}-${c}`}
                            className="absolute flex items-center justify-center"
                            style={{
                              left: `${(c / cols) * 100}%`,
                              top: `${(r / rows) * 100}%`,
                              width: `${(1 / cols) * 100}%`,
                              height: `${(1 / rows) * 100}%`,
                            }}
                          >
                            <span className="bg-black/50 text-white text-xs sm:text-sm font-bold rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center backdrop-blur-sm">
                              {num}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Split button */}
              <div className="mt-6 text-center">
                <button
                  onClick={splitImage}
                  disabled={splitting}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {splitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Splitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Split Image into {rows * cols} Pieces
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Split Results */}
            {pieces.length > 0 && (
              <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold">
                    Split Results{" "}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({pieces.length} pieces)
                    </span>
                  </h2>
                  <button
                    onClick={downloadAll}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All
                  </button>
                </div>

                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(cols, 6)}, minmax(0, 1fr))`,
                  }}
                >
                  {pieces.map((piece) => (
                    <div
                      key={piece.index}
                      className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600/50 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={piece.dataUrl}
                        alt={`Piece ${piece.index}`}
                        className="w-full h-auto"
                      />
                      {/* Number badge */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center backdrop-blur-sm">
                        {piece.index}
                      </div>
                      {/* Download button overlay */}
                      <button
                        onClick={() => downloadPiece(piece)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white text-xs font-medium shadow-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Upload Image",
                desc: "Drop or browse for any image. Everything stays in your browser.",
                icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
              },
              {
                step: "2",
                title: "Choose Grid",
                desc: "Select a preset or set custom rows and columns. Preview the grid overlay live.",
                icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
              },
              {
                step: "3",
                title: "Download Pieces",
                desc: "Split and download individual pieces or all at once as PNG files.",
                icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
