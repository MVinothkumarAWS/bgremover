import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export const metadata = {
  title: "Pricing - BG Remover",
  description: "Choose the right plan for you. Start free, upgrade when you need more.",
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
