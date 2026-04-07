const testimonials = [
  {
    name: "Sarah Chen",
    role: "E-commerce Seller",
    text: "I used to spend hours removing backgrounds in Photoshop. BG Remover does it in seconds and the quality is amazing. My product listings look so much more professional now.",
    avatar: "SC",
  },
  {
    name: "Alex Rivera",
    role: "Graphic Designer",
    text: "The fact that everything runs in my browser is a game changer. No uploading sensitive client images to unknown servers. Plus, the batch processing saves me hours every week.",
    avatar: "AR",
  },
  {
    name: "Priya Sharma",
    role: "Content Creator",
    text: "I create thumbnails for my YouTube channel and this tool is perfect. The touch-up brush and text overlay features mean I barely need to open any other editor.",
    avatar: "PS",
  },
  {
    name: "James Wilson",
    role: "Real Estate Agent",
    text: "I use this for property headshots and marketing materials. The preset templates for different social media sizes are incredibly convenient.",
    avatar: "JW",
  },
  {
    name: "Maria Gonzalez",
    role: "Small Business Owner",
    text: "Finally a free tool that actually delivers on its promise. No watermarks, no limits, no catch. I've recommended it to everyone in my business network.",
    avatar: "MG",
  },
  {
    name: "David Kim",
    role: "Photographer",
    text: "The AI handles complex edges like hair and fur remarkably well. The blur background feature is also great for creating depth-of-field effects quickly.",
    avatar: "DK",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Thousands
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what our users have to say about BG Remover.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
