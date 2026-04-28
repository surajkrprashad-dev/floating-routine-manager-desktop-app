import React from "react";

export default function HistoryItem({
  icon,
  title,
  total,
  accent = "bg-gradient-to-br from-[#FFE0A8] to-[#FFD1A8]",
}) {
  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow mb-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center ${accent} shadow-sm`}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="text-gray-800 font-medium">{title}</div>
      </div>
      <div className="text-gray-500 text-sm">{total} Total Days</div>
    </div>
  );
}
