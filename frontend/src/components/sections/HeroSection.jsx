import SectionContainer from "../ui/SectionContainer";
import HeroIllustration from "./HeroIllustration";

export default function HeroSection({ onCreateRoom, onJoinRoom }) {
  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />

      <HeroIllustration
        aria-hidden
        className="pointer-events-none absolute right-[2%] top-1/2 hidden w-[min(50vw,600px)] -translate-y-[44%] md:block"
      />

      <SectionContainer className="relative">
        <h1 className="max-w-[13ch] font-display text-5xl leading-[1.04] tracking-tight sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl">
          Watch together, in sync.
        </h1>

        <p className="mt-8 max-w-md text-base leading-relaxed text-muted md:text-lg">
          Private rooms, shared playback and a chat on the side. Share a link,
          press play, and everyone is on the same second.
        </p>

        <div className="mt-12 flex items-center gap-10">
          <button
            onClick={onCreateRoom}
            className="eyebrow text-accent transition-colors hover:text-fg"
          >
            Create a room →
          </button>
          <button
            onClick={onJoinRoom}
            className="eyebrow text-muted transition-colors hover:text-fg"
          >
            Join with a code
          </button>
        </div>
      </SectionContainer>

      <div className="eyebrow absolute bottom-8 left-[5%] flex items-center gap-2 text-accent/80 md:left-[max(5%,calc((100%-1120px)/2))]">
        <span aria-hidden>↓</span> Scroll
      </div>
    </section>
  );
}
