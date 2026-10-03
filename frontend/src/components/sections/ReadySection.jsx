import SectionContainer from "../ui/SectionContainer";

export default function ReadySection({ onCreateRoom }) {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <SectionContainer>
        <h2 className="max-w-[16ch] font-display text-4xl leading-tight tracking-tight md:text-6xl">
          Ready to watch together?
        </h2>
        <button
          onClick={onCreateRoom}
          className="eyebrow mt-10 text-accent transition-colors hover:text-fg"
        >
          Create a room →
        </button>
      </SectionContainer>
    </section>
  );
}
