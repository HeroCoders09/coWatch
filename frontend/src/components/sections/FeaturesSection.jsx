import SectionContainer from "../ui/SectionContainer";
import { features } from "../../data/features";

export default function FeaturesSection() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <SectionContainer>
        <p className="eyebrow text-accent">How it works</p>
        <h2 className="mt-6 max-w-[22ch] font-display text-3xl leading-tight tracking-tight md:text-5xl">
          Everything you need for a watch party, nothing you don't.
        </h2>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {features.map((f, i) => (
            <div key={f.title} className="bg-bg p-8 md:p-10">
              <span className="eyebrow text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <dt className="mt-6 font-display text-2xl tracking-tight">
                {f.title}
              </dt>
              <dd className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {f.desc}
              </dd>
            </div>
          ))}
        </dl>
      </SectionContainer>
    </section>
  );
}
