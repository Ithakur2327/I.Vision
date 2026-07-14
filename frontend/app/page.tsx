import { TopNav } from "@/components/TopNav";
import { HeroHeadline } from "@/components/HeroHeadline";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { ChevronDown } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="hero-glow absolute inset-0" />
      <div className="dot-grid absolute inset-y-0 right-0 w-1/2 opacity-40" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopNav />

        <div className="relative flex flex-1 flex-col justify-end px-8 pb-16 md:px-12">
          <div className="flex flex-col-reverse items-start justify-between gap-16 md:flex-row md:items-end">
            <HeroHeadline />
            <div className="w-full md:w-auto md:pr-8">
              <KnowledgePanel />
            </div>
          </div>
        </div>

        <button
          aria-label="Scroll down"
          className="absolute bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 md:right-12"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
