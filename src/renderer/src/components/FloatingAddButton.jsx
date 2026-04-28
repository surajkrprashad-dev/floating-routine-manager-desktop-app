import React from "react";

export default function FloatingAddButton() {
//   const navigate = useNavigate();
  return (
    <button
      onClick={() => alert("Add routine - implement modal or navigation")}
      className="fixed left-1/2 -translate-x-1/2 bottom-14 w-16 h-16 rounded-full bg-sky-400 text-white text-3xl grid place-items-center shadow-[0_10px_30px_rgba(66,153,225,0.28)] border-4 border-white z-30"
      aria-label="Add"
    >
      +
    </button>
  );
}
