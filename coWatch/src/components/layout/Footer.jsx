import { Video } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";

export default function Footer() {
  return (
    <footer className="border-t border-indigo-300/15 bg-linear-to-r from-slate-950/45 to-[#071739]/70">
      <SectionContainer className="flex min-h-30 flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
            <Video size={14} />
          </div>
          <span className="text-[44px] font-bold text-white lg:text-[48px]">CoWatch</span>
        </div>

        <p className="text-center text-[28px] text-slate-400 lg:text-[36px]">
          © 2024 CoWatch. Watch together, stay connected.
        </p>
      </SectionContainer>
    </footer>
  );
}