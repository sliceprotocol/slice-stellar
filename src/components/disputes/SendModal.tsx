"use client";

import React, { useState } from "react";
import { Loader2, X, Scan, ArrowLeft } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useSendFunds } from "@/blockchain/hooks";
import { useStakingToken } from "@/blockchain/hooks";
import { isStellarAddress } from "@/util/address";
import { toast } from "sonner";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose }) => {
  const { symbol } = useStakingToken();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Use the hook, passing a callback to clear the form on success
  const { sendFunds, isSending } = useSendFunds();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStellarAddress(recipient)) {
      toast.error("Enter a valid Stellar address");
      return;
    }
    const success = await sendFunds(recipient, amount);
    if (success) {
      onClose();
      setRecipient("");
      setAmount("");
    }
  };

  const handleScan = (result: string) => {
    if (result) {
      const destinationMatch = result.match(/destination=([^&]+)/i);
      const scannedAddress = destinationMatch
        ? decodeURIComponent(destinationMatch[1])
        : result;

      if (isStellarAddress(scannedAddress)) {
        setRecipient(scannedAddress);
        setIsScanning(false);
        toast.success("Address scanned!");
        return;
      }

      toast.error("Invalid SEP-0007 QR code");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* VIEW 1: QR SCANNER */}
        {isScanning ? (
          <div className="flex flex-col h-full min-h-[350px]">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsScanning(false)}
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#1b1c23] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h3 className="text-sm font-extrabold text-[#1b1c23]">Scan QR</h3>
              <div className="w-8" /> {/* Spacer for balance */}
            </div>

            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-gray-100 shadow-inner">
              <Scanner
                onScan={(detectedCodes) =>
                  handleScan(detectedCodes[0].rawValue)
                }
                components={{
                  torch: false,
                }}
                styles={{
                  container: { height: "100%", width: "100%" },
                }}
              />
              {/* Overlay Guide */}
              <div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-[#8c8fff] bg-transparent rounded-lg opacity-80" />
              </div>
            </div>
                <p className="text-center text-[11px] font-bold text-gray-400 mt-4">
                  Point camera at a Stellar payment QR code
                </p>
          </div>
        ) : (
          /* VIEW 2: SEND FORM */
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-[#1b1c23] font-manrope">
                Send {symbol}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Recipient Stellar Address
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="G..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-4 pr-12 bg-[#f5f6f9] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#8c8fff] transition-all truncate"
                    disabled={isSending}
                  />
                  {/* Scan Button inside Input */}
                  <button
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#8c8fff] hover:bg-white rounded-lg transition-all shadow-sm"
                    title="Scan QR Code"
                  >
                    <Scan className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount ({symbol})
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 bg-[#f5f6f9] rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#8c8fff] transition-all"
                  disabled={isSending}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 mt-2 bg-[#1b1c23] text-white rounded-xl font-bold hover:bg-[#2c2d33] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Send"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
