import React from "react";

interface StatItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface StatsGridProps {
  stats: StatItem[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 flex flex-col justify-between border transition backdrop-blur-md ${
            stat.highlight
              ? "bg-gradient-to-br from-muted/40 via-muted/70 to-muted border-primary/20"
              : "bg-muted/75 border-primary/20"
          }`}
        >
          <span className="text-xs font-semibold text-accent truncate font-poppins">
            {stat.label}
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-secondary tracking-tight font-inter">
              {typeof stat.value === "number"
                ? stat.value.toFixed(2)
                : stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
