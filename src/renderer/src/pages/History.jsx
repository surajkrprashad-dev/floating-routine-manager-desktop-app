// pages/History.jsx
import React, { useState, useEffect, useRef } from "react";
import WeekStrip from "../components/WeekStrip";
import HistoryItem from "../components/HistoryItem";
import BottomNav from "../components/BottomNav";
import FloatingAddButton from "../components/FloatingAddButton";

const History = () => {
  return (
    <div className="p-5 pb-24">
      <WeekStrip />

      <HistoryItem icon="🌅" title="Get Up" total={15} />
      <HistoryItem icon="🧘" title="Meditate" total={5} />
      <HistoryItem icon="📚" title="Read Book" total={3} />

      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default History;
