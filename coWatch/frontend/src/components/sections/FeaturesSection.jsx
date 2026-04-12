import SectionContainer from "../ui/SectionContainer";
import FeatureCard from "../ui/FeatureCard";
import { features } from "../../data/features";

export default function FeaturesSection() {
  return (
    <section className="pt-20 md:pt-24">
      <SectionContainer>
        <h2 className="text-center text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          Everything You Need for the Perfect Watch Party
        </h2>
        <p className="mx-auto mt-4 max-w-195 text-center text-base leading-relaxed text-slate-300 md:text-lg">
          Powerful features designed to make watching videos together seamless and enjoyable.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}