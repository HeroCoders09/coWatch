import { ChevronRight } from "lucide-react";
import SectionContainer from "../ui/SectionContainer";
import GradientButton from "../ui/GradientButton";

export default function ReadySection() {
  return (
    <section className="pb-20 pt-28">
      <SectionContainer>
        <div className="mx-auto w-full max-w-270 rounded-[34px] border border-indigo-200/15 bg-linear-to-r from-[#17335f]/70 to-[#2b2358]/75 px-6 py-16 text-center">
          <h2 className="text-[64px] font-bold leading-tight text-white lg:text-[72px]">
            Ready to Watch Together?
          </h2>

          <p className="mx-auto mt-5 max-w-215 text-[31px] leading-relaxed text-slate-300 lg:text-[42px]">
            Create your private room in seconds and start watching with friends,
            family, or colleagues.
          </p>

          <GradientButton
            className="mt-9 min-w-82.5 px-9 py-4 text-[38px] lg:text-[44px]"
            icon={ChevronRight}
            iconSize={20}
          >
            Get Started Free
          </GradientButton>
        </div>
      </SectionContainer>
    </section>
  );
}