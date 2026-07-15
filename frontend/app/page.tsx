import { TopNav } from "@/components/TopNav";
import { HeroHeadline } from "@/components/HeroHeadline";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="hero-glow absolute inset-0" />
      <div className="dot-grid absolute inset-y-0 right-0 w-1/2 opacity-40" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopNav />

        <div className="relative flex flex-1 items-center px-8 pb-16 md:px-12">
          <HeroHeadline />
        </div>
      </div>
    </main>
  );
}
