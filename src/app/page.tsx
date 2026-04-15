import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import ToolGrid from "@/components/ToolGrid";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import History from "@/components/History";
import UpgradeModal from "@/components/UpgradeModal";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ScrollReveal direction="up">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <AdBanner slot="after-hero" format="horizontal" />
          </div>
        </ScrollReveal>
        <ToolGrid />
        <Features />
        <ScrollReveal direction="up">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <AdBanner slot="after-features" format="horizontal" />
          </div>
        </ScrollReveal>
        <HowItWorks />
        <Gallery />
        <ScrollReveal direction="up">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <AdBanner slot="after-gallery" format="horizontal" />
          </div>
        </ScrollReveal>
        <Testimonials />
        <History />
      </main>
      <UpgradeModal />
      <Footer />
    </>
  );
}
