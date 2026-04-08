import { Sparkles, Video } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function Navbar() {
  return (
    <header className="pt-10">
      <SectionContainer className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white shadow-[0_0_55px_rgba(83,141,255,.42)]">
            <Video size={20} />
          </div>
          <span className="text-[46px] font-bold tracking-tight text-sky-300 md:text-[56px]">
            CoWatch
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden bg-transparent text-[30px] font-semibold text-slate-200 md:block lg:text-[22px]">
            Join Room
          </button>
          <GradientButton className="px-5 py-3 text-[18px] lg:text-[17px]" icon={Sparkles} iconSize={16}>
            Create Room
          </GradientButton>
        </div>
      </SectionContainer>
    </header>
  );
}