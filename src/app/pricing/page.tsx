import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export const metadata = {
  title: "Pricing - BG Remover",
  description: "Choose the right plan for you. Start free, upgrade when you need more.",
  openGraph: {
    title: "Pricing - BG Remover",
    description: "Free, Pro & Business plans. Start removing backgrounds today.",
    url: "https://bgremover.k2techinfo.com/pricing",
  },
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
