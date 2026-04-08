"use client";

import { useAnimateOnScroll } from "@/hooks/useAnimateOnScroll";

const steps = [
  { icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", title: "Upload", description: "Drag & drop, browse, paste URL, or upload multiple for batch." },
  { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: "AI Processes", description: "Our AI removes the background in your browser. Nothing uploaded." },
  { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", title: "Edit & Customize", description: "Change backgrounds, add effects, touch up edges, overlay text." },
  { icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", title: "Download", description: "Export as PNG, JPG, or WebP. Share directly or download." },
];

export default function HowItWorks() {
  const { ref, isVisible } = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950 relative">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Four Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`relative text-center ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-violet-300 to-transparent dark:from-violet-700" />
              )}
              <div className="relative z-10 w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/20 group hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                </svg>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center text-xs font-bold text-violet-600 border-2 border-violet-200 dark:border-violet-800">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[240px] mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
