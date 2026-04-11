export default function SectionContainer({ className = "", children }) {
  return <div className={`mx-auto w-[min(1180px,92%)] ${className}`}>{children}</div>;
}