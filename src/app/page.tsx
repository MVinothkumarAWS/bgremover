import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import History from "@/components/History";
import UpgradeModal from "@/components/UpgradeModal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AdBanner slot="after-hero" format="horizontal" />
        </div>
        <Features />
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AdBanner slot="after-features" format="horizontal" />
        </div>
        <HowItWorks />
        <Gallery />
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AdBanner slot="after-gallery" format="horizontal" />
        </div>
        <Testimonials />
        <History />
      </main>
      <UpgradeModal />
      <Footer />
    </>
  );
}
