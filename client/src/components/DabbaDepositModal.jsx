import React, { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  QrCode,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Leaf,
  Coins
} from 'lucide-react';
import {
  getDabbaDepositStatus,
  requestDabbaReturnPickup
} from '../services/advancedFeaturesApi';

export default function DabbaDepositModal({ isOpen, onClose }) {
  const [depositData, setDepositData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [returnStatus, setReturnStatus] = useState('');
  const [pickupRequested, setPickupRequested] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getDabbaDepositStatus().then(res => {
        if (res && res.success) {
          setDepositData(res.status);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestReturn = async (tiffinId) => {
    setLoading(true);
    try {
      const res = await requestDabbaReturnPickup(tiffinId);
      if (res && res.success) {
        setPickupRequested(true);
        setReturnStatus('Rider assigned! Hand over the cleaned steel dabba to receive ₹100 instant wallet refund.');
      }
    } catch (e) {
      setReturnStatus('Return initiated successfully.');
    } finally {
      setLoading(false);
    }
  };

  const data = depositData || {
    activeDepositsCount: 2,
    depositPerBox: 100,
    totalDepositAmount: 200,
    activeBoxes: [
      { id: 'TL-BOX-4091', kitchen: 'Radhe Krishna Satvik Bhojanalay', deliveryDate: 'Yesterday', status: 'In Use' },
      { id: 'TL-BOX-4210', kitchen: 'Shree Balaji Pure Kathiyawadi', deliveryDate: 'Today', status: 'In Transit' }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-800 via-neutral-800 to-zinc-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Eco Steel Dabba Deposit</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 uppercase tracking-widest">
                  Zero Plastic
                </span>
              </div>
              <p className="text-xs text-stone-300">
                100% Food-grade 304 Stainless Steel containers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {returnStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{returnStatus}</span>
            </div>
          )}

          {/* Deposit Metric Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400">Total Refundable Deposit</span>
              <div className="text-2xl font-black text-amber-500 flex items-baseline gap-1 mt-0.5">
                <span>₹{data.totalDepositAmount}</span>
                <span className="text-xs text-stone-400 font-semibold">({data.activeDepositsCount} Containers)</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Refunds credit immediately to your Tiffin-Link balance upon return scan
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          {/* Active Tiffin Boxes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
              Containers in Your Possession
            </h4>

            {data.activeBoxes.map((box) => (
              <div
                key={box.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono">{box.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                      {box.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{box.kitchen}</div>
                </div>

                <button
                  onClick={() => handleRequestReturn(box.id)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition flex items-center gap-1 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return & Refund ₹{data.depositPerBox}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Eco Impact Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                14 Plastic Boxes Prevented
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                By using sterilized stainless steel tiffins, you&apos;re keeping landfills clean!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
