import { Play } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";

export default function DemoSection() {
  return (
    <section className="pt-16 md:pt-20">
      <SectionContainer>
        <div className="relative min-h-90 overflow-hidden rounded-[28px] border border-indigo-300/15 bg-linear-to-r from-slate-700/30 via-[#13244d]/60 to-slate-900/80 p-6 md:min-h-120">
          <div className="absolute inset-0 grid place-content-center text-center">
            <button className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
              <Play size={28} />
            </button>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Your video experience starts here
            </p>
          </div>

          <div className="absolute bottom-5 left-5 flex">
            {["A", "B", "C", "D", "+5"].map((x, i) => (
              <span
                key={x}
                className={`-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-slate-900 text-[11px] font-bold text-white ${
                  i === 0
                    ? "bg-pink-500"
                    : i === 1
                    ? "bg-sky-500"
                    : i === 2
                    ? "bg-emerald-500"
                    : i === 3
                    ? "bg-violet-500"
                    : "bg-slate-600"
                }`}
              >
                {x}
              </span>
            ))}
          </div>

          <div className="absolute bottom-5 right-5 w-62.5 rounded-2xl border border-indigo-200/15 bg-slate-800/80 p-3 backdrop-blur-sm md:w-70">
            <p className="mb-1 text-sm text-slate-100">
              <strong>Alex</strong> This movie is amazing! 🎬
            </p>
            <p className="text-sm text-slate-100">
              <strong>Sarah</strong> I know right! 🤩
            </p>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}