export default function SectionContainer({ className = "", children }) {
  return (
    <div className={`mx-auto w-[min(1240px,92%)] ${className}`}>{children}</div>
  );
}