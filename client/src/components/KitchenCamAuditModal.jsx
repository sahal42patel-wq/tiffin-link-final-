import React, { useState, useEffect } from 'react';
import {
  Video,
  ShieldCheck,
  CheckCircle2,
  Thermometer,
  Sparkles,
  X,
  Play,
  RotateCw,
  Eye,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getKitchenAuditData } from '../services/advancedFeaturesApi';

export default function KitchenCamAuditModal({ isOpen, onClose, kitchenName = 'Radhe Krishna Satvik Kitchen' }) {
  const [audit, setAudit] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getKitchenAuditData(kitchenName).then(res => {
        if (res && res.success) {
          setAudit(res.audit);
        }
      }).catch(() => {});
    }
  }, [isOpen, kitchenName]);

  if (!isOpen) return null;

  const data = audit || {
    fssaiLicense: '10020021004921',
    cleanlinessRating: 4.9,
    oilQualityTpm: '12% TPM (Fresh cold-pressed)',
    waterPurityTds: '68 ppm (RO + Copper Infused)',
    staffSanitation: '100% Hairnets, Masks & Gloves verified',
    lastSanitizedAt: 'Today, 6:00 AM'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-green-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Kitchen Cam & Hygiene Audit</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 uppercase tracking-widest">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-teal-100">
                100% Transparent Cooking: Watch how your meal is prepped & packed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {/* Simulated CCTV Stream Display */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-stone-950 border border-stone-800 shadow-inner group">
            {/* Background Kitchen Cam Simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-black flex items-center justify-center">
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  CAM 02 &bull; MAIN PREP COOKING HUB
                </div>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  Live stream active &bull; Clean stainless-steel cookware &bull; Filtered RO water
                </p>
              </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                REC &bull; 1080p HD
              </span>
            </div>

            <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
              Temp: 24°C &bull; Kitchen Air Purified
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/80 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl">
              <span className="font-semibold">{kitchenName}</span>
              <span className="font-mono text-[10px] text-stone-400">FPS: 30 &bull; Encryption: AES-256</span>
            </div>
          </div>

          {/* Hygiene Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-bold">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>Oil Freshness (TPM)</span>
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-stone-100 mt-1">
                {data.oilQualityTpm}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                Safe limit is &lt;25% &bull; Grade A
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Water Purity Index</span>
              </div>
              <div className="text-sm font-black text-stone-900 dark:text-stone-100 mt-1">
                {data.waterPurityTds}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                Lab Tested Mineral Balance
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
            <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Daily Cleanliness Audit Passed
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>FSSAI Lic: #{data.fssaiLicense}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{data.staffSanitation}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>UV Sterilized Utensils</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pest-Control Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
