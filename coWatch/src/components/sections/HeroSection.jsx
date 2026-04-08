import { Globe, Play, Users } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function HeroSection() {
  return (
    <section className="pt-16 text-center">
      <SectionContainer>
        <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-5 py-2.5 text-[16px] text-cyan-300">
          <Globe size={16} />
          Watch together from anywhere in the world
        </div>

        <h1 className="mx-auto max-w-275 text-[64px] font-bold leading-[1.05] tracking-tight text-white md:text-[88px] lg:text-[116px]">
          Watch Videos{" "}
          <span className="bg-linear-to-r from-fuchsia-400 via-violet-300 to-sky-300 bg-clip-text text-transparent">
            Together
          </span>
          <br />
          In Perfect Sync
        </h1>

        <p className="mx-auto mt-8 max-w-245 text-[24px] leading-relaxed text-slate-300 md:text-[28px] lg:text-[43px]">
          Create a private room, invite your friends, and enjoy synchronized video
          watching with real-time chat. No distance is too far.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <GradientButton className="px-10 py-5 text-[34px] lg:text-[40px]" icon={Play} iconSize={20}>
            Create a Room
          </GradientButton>

          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-600/70 px-10 py-5 text-[34px] font-semibold text-white transition hover:bg-slate-500/70 lg:text-[40px]">
            <Users size={20} />
            Join Existing Room
          </button>
        </div>
      </SectionContainer>
    </section>
  );
}