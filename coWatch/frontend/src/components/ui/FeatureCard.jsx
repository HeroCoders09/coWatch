export default function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-2xl border border-indigo-300/15 bg-[#0d1638]/85 p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
        {Icon ? <Icon size={18} /> : null}
      </div>
      <h3 className="mb-2 text-xl font-semibold leading-tight text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-300">{desc}</p>
    </article>
  );
}