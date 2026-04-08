"use client";

import { useAnimateOnScroll } from "@/hooks/useAnimateOnScroll";

const features = [
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Lightning Fast", description: "Remove backgrounds in seconds with our AI engine. No waiting, no delays.", color: "from-yellow-400 to-orange-500" },
  { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "100% Private", description: "All processing in your browser. Images never leave your device.", color: "from-green-400 to-emerald-500" },
  { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", title: "Completely Free", description: "No signup, no watermarks, no limits. Use as much as you want.", color: "from-pink-400 to-rose-500" },
  { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", title: "Batch Processing", description: "Upload multiple images and process them all simultaneously.", color: "from-blue-400 to-cyan-500" },
  { icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", title: "Touch-Up Editor", description: "Fine-tune results with erase and restore brush tools.", color: "from-violet-400 to-purple-500" },
  { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", title: "Custom Backgrounds", description: "Choose colors, upload images, or blur the original background.", color: "from-indigo-400 to-blue-500" },
  { icon: "M4 6h16M4 12h8m-8 6h16", title: "Text & Effects", description: "Add text overlays, shadows, and effects to create ready-to-use graphics.", color: "from-teal-400 to-green-500" },
  { icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", title: "Preset Templates", description: "Resize for Instagram, YouTube, LinkedIn, e-commerce and more.", color: "from-amber-400 to-yellow-500" },
  { icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10", title: "Multi-Format Export", description: "Download as PNG, JPG, or WebP with customizable quality.", color: "from-red-400 to-pink-500" },
];

export default function Features() {
  const { ref, isVisible } = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id="features" className="py-24 bg-gray-50/50 dark:bg-gray-900/50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-violet-200/20 dark:bg-violet-800/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`text-center mb-16 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="inline-flex items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Features
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Professional-grade tools for background removal, editing, and export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/5 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
