import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
} from "react";

export const ADMIN_BRAND_COLOR = "#5E7F85";

export type AdminBadgeTone = "default" | "good" | "warn" | "bad" | "brand";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AdminBadge({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: AdminBadgeTone;
}) {
  const toneClassName =
    {
      bad: "bg-rose-50 text-rose-700",
      brand: "bg-[#5E7F85]/10 text-[#5E7F85]",
      default: "bg-slate-100 text-slate-700",
      good: "bg-emerald-50 text-emerald-700",
      warn: "bg-amber-50 text-amber-700",
    }[tone] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={cx(
        "rounded-full px-3 py-1 text-xs font-semibold",
        toneClassName,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function getAdminStatusTone(value: unknown): AdminBadgeTone {
  const text = String(value).toLowerCase();

  if (
    text.includes("out") ||
    text.includes("mismatch") ||
    text.includes("returned") ||
    text.includes("inactive") ||
    text.includes("risk")
  ) {
    return "bad";
  }

  if (
    text.includes("low") ||
    text.includes("partial") ||
    text.includes("cod") ||
    text.includes("due") ||
    text.includes("pending")
  ) {
    return "warn";
  }

  if (
    text.includes("primary") ||
    text.includes("vip") ||
    text.includes("preferred")
  ) {
    return "brand";
  }

  return "good";
}

export function AdminStatCard({
  active = false,
  className,
  helper,
  icon,
  index = 0,
  label,
  onClick,
  value,
}: {
  active?: boolean;
  className?: string;
  helper: ReactNode;
  icon?: ReactNode;
  index?: number;
  label: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  value: ReactNode;
}) {
  const icons = ["#", "=", "BDT", ">"];
  const helperText = String(helper).toLowerCase();
  const helperTone =
    helperText.includes("risk") ||
    helperText.includes("need") ||
    helperText.includes("blocked") ||
    helperText.includes("missing")
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-700";

  return (
    <button
      className={cx(
        "group relative w-full overflow-hidden rounded-[1.7rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        active
          ? "border-[#5E7F85] ring-2 ring-[#5E7F85]/15"
          : "border-slate-200",
        onClick ? "cursor-pointer" : "cursor-default",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5E7F85]/5 transition group-hover:bg-[#5E7F85]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5E7F85]/10 text-xl font-bold text-[#5E7F85]">
          {icon ?? icons[index % icons.length]}
        </div>
      </div>
      <div
        className={cx(
          "relative mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
          helperTone,
        )}
      >
        {helper}
      </div>
    </button>
  );
}

export function AdminHeader({
  actions,
  children,
  className,
  searchInputProps,
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  searchInputProps?: InputHTMLAttributes<HTMLInputElement>;
  title: ReactNode;
}) {
  return (
    <div
      className={cx(
        "overflow-visible rounded-[2rem] border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="hidden rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 text-xs font-semibold text-slate-500 xl:block">
            Ctrl + K
          </div>
          {searchInputProps ? (
            <div className="relative">
              <input
                {...searchInputProps}
                className={cx(
                  "w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-3 pl-10 text-sm outline-none placeholder:text-slate-400 sm:w-[280px]",
                  searchInputProps.className,
                )}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                /
              </span>
            </div>
          ) : null}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AdminSectionCard({
  actions,
  children,
  className,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  subtitle?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section
      className={cx(
        "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      {title || subtitle || actions ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {subtitle ? (
              <div className="text-sm font-medium text-slate-500">
                {subtitle}
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminActionButton({
  children,
  className,
  tone = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "ghost";
}) {
  const toneClassName = {
    ghost:
      "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50",
    primary:
      "rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90",
    secondary:
      "rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-stone-50",
  }[tone];

  return (
    <button
      {...props}
      className={cx(toneClassName, props.disabled && "opacity-45", className)}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
}

export function AdminActionButtons({
  actions,
}: {
  actions: Array<{
    disabled?: boolean;
    label: ReactNode;
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  }>;
}) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => (
        <button
          className={
            index === 0
              ? "rounded-xl bg-[#5E7F85]/10 px-3 py-2 text-xs font-semibold text-[#5E7F85] transition hover:bg-[#5E7F85] hover:text-white disabled:opacity-45"
              : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50 disabled:opacity-45"
          }
          disabled={action.disabled}
          key={String(action.label)}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function AdminQuickActionButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        "group flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-stone-100 disabled:text-slate-400 disabled:hover:bg-stone-50",
        className,
      )}
      type={props.type ?? "button"}
    >
      <span>{children}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5E7F85]/10 text-sm font-bold text-[#5E7F85] transition group-hover:translate-x-0.5 group-hover:bg-[#5E7F85] group-hover:text-white">
        &gt;
      </span>
    </button>
  );
}

export function AdminTableShell({
  actions,
  badge,
  children,
  className,
  label,
  title,
}: {
  actions?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  label?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {title || label || badge || actions ? (
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {label ? (
              <div className="text-sm font-medium text-slate-500">
                {label}
              </div>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {badge ? <AdminBadge tone="brand">{badge}</AdminBadge> : null}
            {actions}
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function AdminTable({
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      className={cx("min-w-full text-left text-sm", className)}
    >
      {children}
    </table>
  );
}

export function AdminTableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead className={cx("sticky top-0 z-10 bg-stone-50 text-slate-500", className)}>
      {children}
    </thead>
  );
}

export function AdminTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cx(
        "border-t border-slate-100 bg-white transition hover:bg-stone-50 hover:shadow-[inset_3px_0_0_#5E7F85]",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function AdminChartCard({
  actions,
  bars,
  children,
  className,
  label,
  title,
}: {
  actions?: ReactNode;
  bars?: Array<{ label: ReactNode; value: number; valueLabel?: ReactNode }>;
  children?: ReactNode;
  className?: string;
  label?: ReactNode;
  title: ReactNode;
}) {
  const max = Math.max(...(bars?.map((bar) => bar.value) ?? [1]), 1);

  return (
    <section
      className={cx(
        "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          {label ? (
            <div className="text-sm font-medium text-slate-500">{label}</div>
          ) : null}
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
        {actions ?? <AdminBadge tone="brand">Live pulse</AdminBadge>}
      </div>
      {bars ? (
        <div className="mt-6 flex h-72 items-end gap-4 overflow-x-auto rounded-3xl bg-stone-50 p-5">
          {bars.map((bar, index) => (
            <div
              className="flex min-w-[70px] flex-1 flex-col items-center gap-3"
              key={`${bar.label}-${index}`}
            >
              <div className="text-xs font-semibold text-slate-500">
                {bar.valueLabel ?? bar.value}
              </div>
              <div className="flex h-48 w-full items-end justify-center rounded-2xl bg-white p-2">
                <div
                  className="w-8 rounded-2xl bg-[#5E7F85]"
                  style={{ height: `${(bar.value / max) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">{bar.label}</div>
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function AdminSelectPill({
  className,
  compact = false,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  compact?: boolean;
  options: Array<string>;
}) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cx(
          "appearance-none rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-stone-50 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#5E7F85] focus:ring-2 focus:ring-[#5E7F85]/15",
          compact ? "min-w-[118px] px-3 pr-8" : "min-w-[132px] px-4 pr-9",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
        v
      </span>
    </div>
  );
}
