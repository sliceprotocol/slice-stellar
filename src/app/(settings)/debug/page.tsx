"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Terminal } from "lucide-react";

export default function DebugPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-manrope pb-20">
      <div className="pt-8 px-6 pb-4 bg-white shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1b1c23]" />
          </button>
          <h1 className="text-xl font-extrabold text-[#1b1c23] flex items-center gap-2">
            <Terminal className="w-6 h-6 text-[#8c8fff]" /> Debug Console
          </h1>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-[#1b1c23] text-white p-6 rounded-2xl font-mono text-sm">
          <p className="text-green-400">STATUS: MOCK_MODE_ACTIVE</p>
          <p>Legacy Provider: REMOVED</p>
          <p>Blockchain: LOCAL_STORAGE_SIMULATION</p>
        </div>
      </div>
    </div>
  );
}
