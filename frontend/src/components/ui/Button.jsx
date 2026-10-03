const variants = {
  primary:
    "bg-fg text-bg hover:bg-white px-5 py-2.5 text-sm font-medium rounded-lg",
  ghost:
    "border border-line text-fg hover:border-muted hover:bg-raised px-5 py-2.5 text-sm font-medium rounded-lg",
  danger:
    "border border-danger/40 text-danger hover:bg-danger/10 px-5 py-2.5 text-sm font-medium rounded-lg",
  link: "eyebrow text-accent hover:text-fg px-0 py-0",
  linkMuted: "eyebrow text-muted hover:text-fg px-0 py-0",
};

export default function Button({
  children,
  variant = "primary",
  icon: Icon,
  iconSize = 15,
  className = "",
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variants[variant]} ${className}`}
      {...rest}
    >
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
    </button>
  );
}
