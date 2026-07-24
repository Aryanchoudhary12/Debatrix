import React from "react";
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}
function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="p-2 px-4 bg-primary rounded-xl flex gap-3 md:gap-2 md:flex-col">
      {icon}
      <p className="font-poppins text-sky-200 text-xs font-medium flex flex-col md:items-end">
        {title} <br />
        <span className="font-poppins text-white text-sm font-bold">
          {value}
        </span>
      </p>
    </div>
  );
}

export default StatCard;
