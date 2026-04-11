import { Globe, Play, Users } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function HeroSection({ onCreateRoom, onJoinRoom }) {
  return (
    <section className="pt-14 text-center md:pt-16">
      <SectionContainer>
        <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
          <Globe size={15} />
          Watch together from anywhere in the world
        </div>

        <h1 className="mx-auto max-w-230 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Watch Videos{" "}
          <span className="bg-linear-to-r from-fuchsia-400 via-violet-300 to-sky-300 bg-clip-text text-transparent">
            Together
          </span>
          <br />
          In Perfect Sync
        </h1>

        <p className="mx-auto mt-6 max-w-190 text-base leading-relaxed text-slate-300 md:text-lg">
          Create a private room, invite your friends, and enjoy synchronized video
          watching with real-time chat. No distance is too far.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GradientButton
            onClick={onCreateRoom}
            className="rounded-2xl px-7 py-3.5 text-base md:text-lg"
            icon={Play}
            iconSize={17}
          >
            Create a Room
          </GradientButton>

          <button
            onClick={onJoinRoom}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-600/70 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-slate-500/70 md:text-lg"
          >
            <Users size={17} />
            Join Existing Room
          </button>
        </div>
      </SectionContainer>
    </section>
  );
}