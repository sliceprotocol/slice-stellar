"use client";

import { useState } from "react";
import { NetworkDebugger } from "./NetworkDebugger";

export const DebugToggle = () => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("slice_debug_mode") === "true";
  });

  if (typeof window === "undefined") return null;

  const toggle = () => {
    const next = !isVisible;
    setIsVisible(next);
    localStorage.setItem("slice_debug_mode", String(next));
    // Dispatch event for any other components listening
    window.dispatchEvent(new Event("debug-toggle"));
  };

  return (
    <>
      <button
        onClick={toggle}
        className={`fixed bottom-6 right-6 z-[10000] p-2 rounded-full border transition-all duration-200 shadow-lg backdrop-blur-md flex items-center justify-center
          ${
            isVisible
              ? "bg-purple-500/20 border-purple-500 text-purple-400 opacity-100"
              : "bg-black/40 border-white/10 text-white/40 hover:text-purple-400 hover:border-purple-500/50 hover:opacity-100 opacity-60"
          }`}
        title="Network Inspector"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </button>

      {isVisible && <NetworkDebugger />}
    </>
  );
};
