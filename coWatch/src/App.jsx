import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HeroSection from "./components/sections/HeroSection";
import FeaturesSection from "./components/sections/FeaturesSection";
import DemoSection from "./components/sections/DemoSection";
import ReadySection from "./components/sections/ReadySection";

export default function App() {
  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_10%_20%,#122050_0%,transparent_35%),radial-gradient(circle_at_90%_20%,#2a216b_0%,transparent_35%),linear-gradient(135deg,#0b1233,#1d1b5b)]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <DemoSection />
      <ReadySection />
      <Footer />
    </div>
  );
}