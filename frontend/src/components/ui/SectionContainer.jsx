export default function SectionContainer({ className = "", children }) {
  return <div className={`mx-auto w-[min(1120px,90%)] ${className}`}>{children}</div>;
}
