import React from "react";
import Header from "../components/Header";
import TaskCard from "../components/TaskCard";
import FloatingAddButton from "../components/FloatingAddButton";
import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7D9B6_0%,#F6D5A9_25%,#F5EDE2_100%)] flex flex-col items-center pb-28">
      <div className="w-full max-w-md">
        <Header />

        <div className="px-5 -mt-8">
          <TaskCard
            icon="🌅"
            title="Get Up"
            time="5:00 AM"
            progressLabel="Day 18/30"
            iconColor="from-[#FFE0A8] to-[#FFD1A8]"
            ringColor="ring-[#BDEFFF]"
          />
          <TaskCard
            icon="🧘"
            title="Meditate"
            time="5:00 - 5:15 AM"
            progressLabel="Day 5/30"
            iconColor="from-[#FBD1FF] to-[#F4C7FF]"
            ringColor="ring-[#F6C9F7]"
          />
          <TaskCard
            icon="📚"
            title="Read Book"
            time="5:15 - 5:30 AM"
            progressLabel="Day 3/30"
            iconColor="from-[#D7FFD0] to-[#CFFFC6]"
            ringColor="ring-[#CFF0D6]"
          />
        </div>
      </div>

      <FloatingAddButton />
      <BottomNav />
    </div>
  );
}
