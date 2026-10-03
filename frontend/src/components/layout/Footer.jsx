import SectionContainer from "../ui/SectionContainer";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <SectionContainer className="flex flex-col items-start justify-between gap-3 py-8 md:flex-row md:items-center">
        <span className="font-display text-xl text-accent">CoWatch</span>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} CoWatch. Watch together, stay connected.
        </p>
      </SectionContainer>
    </footer>
  );
}
