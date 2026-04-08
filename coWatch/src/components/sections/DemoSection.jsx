import { Play } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";

export default function DemoSection() {
  return (
    <section className="pt-24">
      <SectionContainer>
        <div className="relative min-h-155 overflow-hidden rounded-4xl border border-indigo-300/15 bg-linear-to-r from-slate-700/35 via-[#12244d]/60 to-slate-900/80 p-8 md:min-h-175">
          <div className="absolute inset-0 grid place-content-center text-center">
            <button className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
              <Play size={34} />
            </button>
            <p className="mt-4 text-[20px] text-slate-300 md:text-[24px]">
              Your video experience starts here
            </p>
          </div>

          <div className="absolute bottom-7 left-7 flex">
            {["A", "B", "C", "D", "+5"].map((x, i) => (
              <span
                key={x}
                className={`-ml-2 grid h-12 w-12 place-items-center rounded-full border-2 border-slate-900 text-[16px] font-bold text-white ${
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

          <div className="absolute bottom-7 right-7 w-[320px] rounded-2xl border border-indigo-200/15 bg-slate-800/80 p-4 backdrop-blur-sm">
            <p className="mb-2 text-[17px] text-slate-100">
              <strong>Alex</strong> This movie is amazing! 🎬
            </p>
            <p className="text-[17px] text-slate-100">
              <strong>Sarah</strong> I know right! 🤩
            </p>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}