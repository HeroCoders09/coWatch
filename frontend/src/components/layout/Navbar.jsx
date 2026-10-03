import SectionContainer from "../ui/SectionContainer";

export default function Navbar({ onCreateRoom, onJoinRoom }) {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <SectionContainer className="flex h-20 items-center justify-between">
        <span className="font-display text-2xl tracking-tight text-accent">
          CoWatch
        </span>

        <nav className="flex items-center gap-8">
          <button
            onClick={onJoinRoom}
            className="eyebrow text-muted transition-colors hover:text-fg"
          >
            Join
          </button>
          <button
            onClick={onCreateRoom}
            className="eyebrow text-accent transition-colors hover:text-fg"
          >
            Create room
          </button>
        </nav>
      </SectionContainer>
    </header>
  );
}
