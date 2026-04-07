import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import History from "@/components/History";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Gallery />
        <Testimonials />
        <History />
      </main>
      <Footer />
    </>
  );
}
