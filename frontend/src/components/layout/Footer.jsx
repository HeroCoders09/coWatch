import { Video } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";

export default function Footer() {
  return (
    <footer className="border-t border-indigo-300/15 bg-linear-to-r from-slate-950/45 to-[#071739]/70">
      <SectionContainer className="flex min-h-22.5 flex-col items-center justify-between gap-3 py-5 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
            <Video size={13} />
          </div>
          <span className="text-2xl font-bold text-white">CoWatch</span>
        </div>

        <p className="text-center text-sm text-slate-400 md:text-base">
          © 2024 CoWatch. Watch together, stay connected.
        </p>
      </SectionContainer>
    </footer>
  );
}