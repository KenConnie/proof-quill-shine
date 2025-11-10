import Logo from "@/components/Logo";
import Hero from "@/components/Hero";
import TravelMap from "@/components/TravelMap";
import JourneyLogger from "@/components/JourneyLogger";
import Timeline from "@/components/Timeline";
import WalletConnect from "@/components/WalletConnect";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <WalletConnect />
        </div>
      </header>
      
      <main className="pt-20">
        <Hero />
        <TravelMap />
        <JourneyLogger />
      </main>
      
      <Timeline />
    </div>
  );
};

export default Index;
