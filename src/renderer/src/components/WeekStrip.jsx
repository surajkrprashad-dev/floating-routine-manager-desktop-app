import React from "react";

export default function WeekStrip() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="grid grid-cols-7 gap-2 text-center mb-4">
      {days.map((d, i) => (
        <div key={d} className={`p-2 rounded-xl ${i === 4 ? "bg-sky-400 text-white" : "bg-transparent text-gray-600"}`}>
          <div className="text-xs">{d}</div>
          <div className="text-sm font-medium">{5 + i}</div>
        </div>
      ))}
    </div>
  );
}
