import React from "react";

export default function Header() {
  return (
    <div className="relative overflow-hidden rounded-b-[48%] h-64 bg-gradient-to-b from-[#65C7F6] to-[#9AE6FF] shadow-xl">
      {/* sun */}
      <div className="absolute left-1/2 -translate-x-1/2 top-8">
        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#FFD06B] to-[#FFB36B] shadow-[0_18px_40px_rgba(255,176,107,0.22)]"></div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
        <p className="text-sm text-gray-700">Next Reminder</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">8 hours remaining</h1>
      </div>
    </div>
  );
}

