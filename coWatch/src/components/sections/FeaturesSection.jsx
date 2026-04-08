import SectionContainer from "../ui/SectionContainer";
import FeatureCard from "../ui/FeatureCard";
import { features } from "../../data/features";

export default function FeaturesSection() {
  return (
    <section className="pt-28">
      <SectionContainer>
        <h2 className="text-center text-[62px] font-bold leading-tight text-white lg:text-[72px]">
          Everything You Need for the Perfect Watch Party
        </h2>
        <p className="mx-auto mt-5 max-w-245 text-center text-[30px] leading-relaxed text-slate-300 lg:text-[42px]">
          Powerful features designed to make watching videos together seamless and
          enjoyable.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}