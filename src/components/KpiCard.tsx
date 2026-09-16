import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  context: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  context,
  icon: Icon,
  tone = "blue",
  onClick,
}: KpiCardProps) {
  const content = (
    <>
      <span className={`kpi-card__icon kpi-card__icon--${tone}`}>
        <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
      </span>
      <span className="kpi-card__body">
        <span className="kpi-card__label">{label}</span>
        <strong className="kpi-card__value">{value}</strong>
        <span className="kpi-card__context">{context}</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button className="kpi-card kpi-card--button" onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <article className="kpi-card">{content}</article>;
}
