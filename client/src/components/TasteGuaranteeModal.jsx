import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  RotateCcw,
  Sparkles,
  X,
  MessageSquare,
  ThumbsDown,
  Clock
} from 'lucide-react';
import { submitTasteGuaranteeClaim } from '../services/advancedFeaturesApi';

export default function TasteGuaranteeModal({ isOpen, onClose, activeOrders = [] }) {
  const [orderId, setOrderId] = useState('ord-recent-01');
  const [issueType, setIssueType] = useState('Too salty/spicy');
  const [compensationChoice, setCompensationChoice] = useState('full_refund');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await submitTasteGuaranteeClaim({
        orderId,
        kitchenName: 'Radhe Krishna Satvik Kitchen',
        issueType,
        compensationChoice,
        notes
      });

      if (res && res.success) {
        setClaimResult(res.claim);
        setClaimed(true);
      }
    } catch (err) {
      alert('Error submitting claim: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-pink-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">100% Taste & Freshness Guarantee</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  Zero Hassle
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Didn&apos;t love the taste? We refund or replace it instantly — no questions asked.
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
        <div className="p-6 space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {claimed ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Claim Approved Instantly!</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {compensationChoice === 'full_refund'
                  ? '₹120 has been credited back to your Tiffin-Link Wallet instantly. We have also notified the head chef to adjust spice levels.'
                  : 'An immediate replacement meal has been dispatched from our closest kitchen express hub!'}
              </p>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono">
                Claim Ref: {claimResult?.claimId || 'CLM-90184'} &bull; Status: Auto-Resolved
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-bold"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Which Meal Had an Issue?
                </label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ord-recent-01">Today&apos;s Lunch (Gujarati Dal-Bhat & Phulka Thali)</option>
                  <option value="ord-recent-02">Yesterday&apos;s Dinner (Kathiyawadi Sev Tameta)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  What Went Wrong?
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Too salty/spicy',
                    'Oil level too high',
                    'Cold / delayed arrival',
                    'Missing salad / sweet',
                    'Texture not tender',
                    'Burnt roti'
                  ].map((issue) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setIssueType(issue)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                        issueType === issue
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                          : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Select Desired Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition ${
                      compensationChoice === 'full_refund'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                        : 'border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comp"
                      checked={compensationChoice === 'full_refund'}
                      onChange={() => setCompensationChoice('full_refund')}
                      className="hidden"
                    />
                    <div className="font-bold text-xs text-rose-600 dark:text-rose-400">100% Instant Refund</div>
                    <p className="text-[10px] text-stone-500 mt-0.5">Credited to wallet in under 10 seconds</p>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition ${
                      compensationChoice === 'replacement_meal'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                        : 'border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comp"
                      checked={compensationChoice === 'replacement_meal'}
                      onChange={() => setCompensationChoice('replacement_meal')}
                      className="hidden"
                    />
                    <div className="font-bold text-xs text-rose-600 dark:text-rose-400">Dispatch Fresh Meal</div>
                    <p className="text-[10px] text-stone-500 mt-0.5">Hot replacement delivered ASAP</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Optional Feedback for Chef
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what you didn't like so we can improve the recipe..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wider transition shadow"
              >
                {loading ? 'Processing Guarantee...' : 'Claim 100% Taste Guarantee'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
