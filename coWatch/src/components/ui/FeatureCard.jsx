export default function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <article className="rounded-3xl border border-indigo-300/15 bg-[#0d1638]/85 p-7 lg:p-8">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-cyan-400 to-fuchsia-500 text-white">
        {Icon ? <Icon size={22} /> : null}
      </div>
      <h3 className="mb-3 text-[30px] font-semibold leading-tight text-white">
        {title}
      </h3>
      <p className="text-[32px]/[1.35] text-slate-300 lg:text-[18px]">{desc}</p>
    </article>
  );
}