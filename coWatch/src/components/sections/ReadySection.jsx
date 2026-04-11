import { ChevronRight } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function ReadySection({ onCreateRoom }) {
  return (
    <section className="pb-16 pt-20 md:pt-24">
      <SectionContainer>
        <div className="mx-auto w-full max-w-245 rounded-[30px] border border-indigo-200/15 bg-linear-to-r from-[#17335f]/65 to-[#2b2358]/70 px-6 py-12 text-center">
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Ready to Watch Together?
          </h2>

          <p className="mx-auto mt-4 max-w-180 text-base leading-relaxed text-slate-300 md:text-lg">
            Create your private room in seconds and start watching with friends,
            family, or colleagues.
          </p>

          <GradientButton
            onClick={onCreateRoom}
            className="mt-7 min-w-55 rounded-2xl px-7 py-3.5 text-base md:text-lg"
            icon={ChevronRight}
            iconSize={18}
          >
            Get Started Free
          </GradientButton>
        </div>
      </SectionContainer>
    </section>
  );
}