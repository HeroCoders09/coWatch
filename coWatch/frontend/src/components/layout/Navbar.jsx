import { Sparkles, Video } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function Navbar({ onCreateRoom, onJoinRoom }) {
  return (
    <header className="pt-8 md:pt-10">
      <SectionContainer className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white shadow-[0_0_40px_rgba(83,141,255,.35)]">
            <Video size={17} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-sky-300 md:text-4xl">
            CoWatch
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onJoinRoom}
            className="hidden bg-transparent text-[15px] font-semibold text-slate-200 md:block"
          >
            Join Room
          </button>

          <GradientButton
            onClick={onCreateRoom}
            className="rounded-xl px-4 py-2.5 text-sm md:text-[15px]"
            icon={Sparkles}
            iconSize={14}
          >
            Create Room
          </GradientButton>
        </div>
      </SectionContainer>
    </header>
  );
}