export default function GradientButton({
  children,
  className = "",
  icon: Icon,
  iconSize = 18,
  onClick,
  type = "button",
  disabled = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-400 to-fuchsia-500 px-6 py-3.5 font-semibold text-white shadow-[0_10px_28px_rgba(63,164,255,.35)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
    </button>
  );
}