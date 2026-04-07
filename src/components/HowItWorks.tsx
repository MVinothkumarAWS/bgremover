const steps = [
  {
    number: "1",
    title: "Upload Your Image",
    description: "Drag and drop, browse files, paste a URL, or upload multiple images for batch processing.",
  },
  {
    number: "2",
    title: "AI Removes Background",
    description: "Our AI model processes your image right in your browser. No data is sent to any server.",
  },
  {
    number: "3",
    title: "Edit & Customize",
    description: "Change backgrounds, add effects, touch up edges, overlay text, and resize to any template.",
  },
  {
    number: "4",
    title: "Download & Share",
    description: "Export as PNG, JPG, or WebP. Download instantly or share directly to social media.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Four simple steps from upload to download</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="text-center relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-blue-200 dark:bg-blue-800" />
              )}
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 relative z-10">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
