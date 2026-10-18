import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils
} from 'lucide-react';
import { requestMealSwap, getMySwaps } from '../services/advancedFeaturesApi';

export default function MealSwapModal({ isOpen, onClose, activeOrders = [] }) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [replacementDate, setReplacementDate] = useState('Tomorrow');
  const [targetMeal, setTargetMeal] = useState('Kathiyawadi Ringan Oro & Bajra Rotla');
  const [dietaryType, setDietaryType] = useState('Pure Veg');
  const [reason, setReason] = useState('taste_variety');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pastSwaps, setPastSwaps] = useState([]);

  useEffect(() => {
    if (activeOrders?.length > 0 && !selectedOrderId) {
      setSelectedOrderId(activeOrders[0]._id || activeOrders[0].id);
    }
  }, [activeOrders]);

  useEffect(() => {
    if (isOpen) {
      getMySwaps().then(res => {
        if (res && res.success) {
          setPastSwaps(res.swaps || []);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwap = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await requestMealSwap({
        orderId: selectedOrderId || 'sub-ord-01',
        scheduledDate: replacementDate,
        targetMealType: targetMeal,
        dietaryType,
        reason
      });

      if (res && res.success) {
        setMessage('Meal swap confirmed! Tomorrow’s meal has been upgraded with 0 extra fees.');
        setPastSwaps(prev => [res.swapRequest, ...prev]);
      }
    } catch (err) {
      setMessage('Swap processed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Meal Swap & Substitute</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  Flexi-Pass
                </span>
              </div>
              <p className="text-xs text-orange-100">
                Not feeling today’s scheduled menu? Swap for any alternative home kitchen special!
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
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Quota Badge */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-900 dark:text-amber-300">
                Monthly Swap Allowance:
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
              3 of 4 Free Swaps Left
            </span>
          </div>

          <form onSubmit={handleSwap} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Select Active Subscription / Meal Day
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="sub-tomorrow">Tomorrow&apos;s Lunch (Standard Gujarati Thali)</option>
                <option value="sub-friday">Friday&apos;s Dinner (Dal Khichdi & Buttermilk)</option>
                <option value="sub-saturday">Saturday&apos;s Lunch (Puri Sabji Feast)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Choose Replacement Dish / Thali
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Kathiyawadi Ringan Oro & Bajra Rotla', desc: 'Charcoal-roasted eggplant with handmade millet rotla' },
                  { name: 'Special Rajasthani Dal Baati Churma', desc: 'Baked wheat baatis in pure desi ghee with spiced lentil soup' },
                  { name: 'Satvik Jain Paneer Bhurji & Phulka Box', desc: 'Fresh paneer crumbled with cumin and turmeric, zero root veg' },
                  { name: 'Light Moong Khichdi & Roasted Papad', desc: 'Ultra-light soothing comfort meal for detox' }
                ].map((item) => (
                  <label
                    key={item.name}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      targetMeal === item.name
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="targetMeal"
                        checked={targetMeal === item.name}
                        onChange={() => setTargetMeal(item.name)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-xs font-bold">{item.name}</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">{item.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Dietary Preparation
                </label>
                <select
                  value={dietaryType}
                  onChange={(e) => setDietaryType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Pure Veg">Pure Vegetarian</option>
                  <option value="Jain">100% Jain</option>
                  <option value="Swaminarayan">Swaminarayan Satvik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Reason for Swap
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="taste_variety">Craving Something Different</option>
                  <option value="fasting_tithi">Fasting / Special Religious Day</option>
                  <option value="travel_shift">Time Shift</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs tracking-wider transition shadow"
            >
              {loading ? 'Processing Swap...' : 'Confirm Meal Substitution (Free)'}
            </button>
          </form>

          {/* Past Swaps History */}
          {pastSwaps.length > 0 && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
              <h5 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                Recent Substituted Meals
              </h5>
              <div className="space-y-2">
                {pastSwaps.slice(0, 3).map((sw, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold">{sw.targetMealType}</span>
                      <p className="text-[10px] text-stone-500">{sw.scheduledDate} &bull; {sw.dietaryType}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Swapped
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
