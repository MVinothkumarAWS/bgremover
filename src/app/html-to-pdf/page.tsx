"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type InputMode = "upload" | "paste";
type PageSize = "a4" | "letter" | "a3" | "a5";
type Orientation = "portrait" | "landscape";

const PAGE_SIZES: Record<PageSize, { label: string; width: number; height: number }> = {
  a4: { label: "A4", width: 210, height: 297 },
  letter: { label: "Letter", width: 215.9, height: 279.4 },
  a3: { label: "A3", width: 297, height: 420 },
  a5: { label: "A5", width: 148, height: 210 },
};

export default function HtmlToPdfPage() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [htmlContent, setHtmlContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState(10);
  const [converting, setConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Update preview iframe when HTML content changes
  useEffect(() => {
    if (previewIframeRef.current && htmlContent) {
      const doc = previewIframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [htmlContent]);

  // Clean up PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setHtmlContent(text);
        }
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const handlePasteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHtmlContent(e.target.value);
      setError(null);
    },
    []
  );

  const convertToPdf = useCallback(async () => {
    if (!htmlContent.trim()) {
      setError("Please provide HTML content first.");
      return;
    }

    setConverting(true);
    setError(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const { jsPDF } = await import("jspdf");

      const size = PAGE_SIZES[pageSize];
      const w = orientation === "portrait" ? size.width : size.height;
      const h = orientation === "portrait" ? size.height : size.width;

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [w, h],
      });

      // Create a temporary hidden iframe to render the HTML
      const tempIframe = document.createElement("iframe");
      tempIframe.style.position = "fixed";
      tempIframe.style.left = "-9999px";
      tempIframe.style.top = "-9999px";
      tempIframe.style.width = `${w * 3.78}px`; // mm to px approx
      tempIframe.style.height = `${h * 3.78}px`;
      tempIframe.style.border = "none";
      document.body.appendChild(tempIframe);

      const iframeDoc = tempIframe.contentDocument;
      if (!iframeDoc) {
        throw new Error("Could not access iframe document.");
      }
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const contentWidth = w - margin * 2;

      await new Promise<void>((resolve, reject) => {
        pdf.html(iframeDoc.body, {
          callback: (doc) => {
            try {
              const blob = doc.output("blob");
              const url = URL.createObjectURL(blob);
              setPdfUrl(url);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          margin: [margin, margin, margin, margin],
          width: contentWidth,
          windowWidth: contentWidth * 3.78,
          autoPaging: "text",
        });
      });

      document.body.removeChild(tempIframe);
    } catch (err) {
      console.error("PDF conversion error:", err);
      setError(
        err instanceof Error
          ? `Conversion failed: ${err.message}`
          : "An unexpected error occurred during conversion."
      );
    } finally {
      setConverting(false);
    }
  }, [htmlContent, pageSize, orientation, margin, pdfUrl]);

  const downloadPdf = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    const baseName = fileName
      ? fileName.replace(/\.[^.]+$/, "")
      : "output";
    a.download = `${baseName}.pdf`;
    a.click();
  }, [pdfUrl, fileName]);

  const clearAll = useCallback(() => {
    setHtmlContent("");
    setFileName("");
    setError(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950" />
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-300/15 dark:bg-violet-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-indigo-300/15 dark:bg-indigo-600/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  HTML to PDF
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Convert HTML files or code into professional PDF documents.
                100% client-side &mdash; your data never leaves your device.
              </p>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setInputMode("upload")}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                    inputMode === "upload"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Upload HTML File
                </button>
                <button
                  onClick={() => setInputMode("paste")}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                    inputMode === "paste"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Paste HTML Code
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Input + Settings */}
              <div className="space-y-6">
                {/* Input Area */}
                <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {inputMode === "upload" ? "Upload HTML File" : "Paste HTML Code"}
                  </h2>

                  {inputMode === "upload" ? (
                    <div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center transition-all duration-300 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".html,.htm"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <svg
                              className="w-7 h-7 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {fileName ? (
                                <>
                                  Loaded:{" "}
                                  <span className="text-violet-600 dark:text-violet-400">
                                    {fileName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  Click to upload{" "}
                                  <span className="text-violet-600 dark:text-violet-400">
                                    .html / .htm
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Select an HTML file from your device
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={htmlContent}
                      onChange={handlePasteChange}
                      placeholder={`<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; }\n    h1 { color: #4c1d95; }\n  </style>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>Your HTML content here...</p>\n</body>\n</html>`}
                      className="w-full h-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      spellCheck={false}
                    />
                  )}
                </div>

                {/* Configuration Options */}
                <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    PDF Settings
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Page Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Page Size
                      </label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as PageSize)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        {(Object.keys(PAGE_SIZES) as PageSize[]).map((key) => (
                          <option key={key} value={key}>
                            {PAGE_SIZES[key].label} ({PAGE_SIZES[key].width} x{" "}
                            {PAGE_SIZES[key].height} mm)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Orientation
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        {(["portrait", "landscape"] as const).map((o) => (
                          <button
                            key={o}
                            onClick={() => setOrientation(o)}
                            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors capitalize ${
                              orientation === o
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Margin:{" "}
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                          {margin}mm
                        </span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0mm</span>
                        <span>50mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={convertToPdf}
                    disabled={converting || !htmlContent.trim()}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {converting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Converting...
                      </span>
                    ) : (
                      "Convert to PDF"
                    )}
                  </button>

                  {pdfUrl && (
                    <button
                      onClick={downloadPdf}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download PDF
                      </span>
                    </button>
                  )}

                  {htmlContent && (
                    <button
                      onClick={clearAll}
                      className="px-6 py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Right Column: Preview + PDF */}
              <div className="space-y-6">
                {/* HTML Preview */}
                <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      HTML Preview
                    </h2>
                  </div>
                  <div className="bg-white dark:bg-gray-900">
                    {htmlContent ? (
                      <iframe
                        ref={previewIframeRef}
                        sandbox="allow-same-origin"
                        title="HTML Preview"
                        className="w-full h-[400px] border-0"
                      />
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 opacity-50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                            />
                          </svg>
                          <p>HTML preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Preview */}
                {pdfUrl && (
                  <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        PDF Output
                      </h2>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Ready
                      </span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-900">
                      <iframe
                        src={pdfUrl}
                        title="PDF Preview"
                        className="w-full h-[400px] border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
