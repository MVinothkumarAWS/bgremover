"use client";

import { useAnimateOnScroll } from "@/hooks/useAnimateOnScroll";

const testimonials = [
  { name: "Sarah Chen", role: "E-commerce Seller", text: "I used to spend hours in Photoshop. BG Remover does it in seconds. My product listings look so much more professional now.", color: "from-pink-500 to-rose-500" },
  { name: "Alex Rivera", role: "Graphic Designer", text: "Everything runs in my browser - no uploading sensitive client images to unknown servers. The batch processing saves me hours.", color: "from-blue-500 to-cyan-500" },
  { name: "Priya Sharma", role: "Content Creator", text: "I create thumbnails for YouTube and this tool is perfect. The touch-up brush and text overlay mean I barely need any other editor.", color: "from-violet-500 to-purple-500" },
  { name: "James Wilson", role: "Real Estate Agent", text: "I use this for property headshots and marketing materials. The preset templates for social media sizes are incredibly convenient.", color: "from-amber-500 to-orange-500" },
  { name: "Maria Gonzalez", role: "Small Business Owner", text: "Finally a free tool that actually delivers. No watermarks, no limits, no catch. I've recommended it to everyone.", color: "from-emerald-500 to-teal-500" },
  { name: "David Kim", role: "Photographer", text: "The AI handles complex edges like hair and fur remarkably well. The blur background feature creates beautiful depth-of-field effects.", color: "from-red-500 to-pink-500" },
];

export default function Testimonials() {
  const { ref, isVisible } = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-purple-200/15 dark:bg-purple-800/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`text-center mb-16 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="inline-flex items-center px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Loved by Thousands
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 bg-gradient-to-br ${t.color} rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
