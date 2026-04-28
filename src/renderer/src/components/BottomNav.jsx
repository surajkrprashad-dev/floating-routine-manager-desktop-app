import React from "react";
// import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
//   const loc = useLocation();
  return (
    <nav className="fixed left-0 bottom-0 w-full flex justify-center z-20">
      <div className="w-full max-w-md bg-white h-16 rounded-t-3xl shadow-md flex justify-around items-center px-8">
        <a to="/" className={`flex flex-col items-center text-sm `}>
          <span className="text-2xl">🏠</span>
          <span className="mt-1">Home</span>
        </a>

        {/* placeholder center for floating button */}
        <div className="w-16"></div>

        <a to="/history" className={`flex flex-col items-center text-sm `}>
          <span className="text-2xl">📅</span>
          <span className="mt-1">Routine</span>
        </a>
      </div>
    </nav>
  );
}
