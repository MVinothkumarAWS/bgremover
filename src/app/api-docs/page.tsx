import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApiDocs from "@/components/ApiDocs";

export const metadata = {
  title: "API Documentation - BG Remover",
  description: "Integrate background removal into your app with our free API. 50 requests/day free tier.",
  openGraph: {
    title: "API Documentation - BG Remover",
    description: "REST API for background removal. Code examples in cURL, Python, JavaScript, PHP.",
    url: "https://bgremover.k2techinfo.com/api-docs",
  },
};

export default function ApiDocsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ApiDocs />
      </main>
      <Footer />
    </>
  );
}
