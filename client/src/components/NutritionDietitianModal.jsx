import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Apple,
  Activity,
  Flame,
  MessageCircle,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  Send,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import {
  getDailyNutritionSummary,
  getDietitians,
  bookDietitianConsultation
} from '../services/advancedFeaturesApi';

export default function NutritionDietitianModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('tracker'); // 'tracker' | 'consult'
  const [nutrition, setNutrition] = useState(null);
  const [dietitians, setDietitians] = useState([]);
  const [selectedDietitianId, setSelectedDietitianId] = useState('');
  const [slot, setSlot] = useState('Tomorrow, 4:00 PM');
  const [healthGoals, setHealthGoals] = useState('Balanced nutrition, low oil, diabetic-friendly');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getDailyNutritionSummary().then(res => {
        if (res && res.success) {
          setNutrition(res.nutrition);
        }
      }).catch(() => {});

      getDietitians().then(res => {
        if (res && res.success) {
          setDietitians(res.dietitians || []);
          if (res.dietitians?.length > 0) {
            setSelectedDietitianId(res.dietitians[0].dietitianId);
          }
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await bookDietitianConsultation({
        dietitianId: selectedDietitianId || 'dt-1',
        preferredSlot: slot,
        notes: healthGoals
      });
      if (res && res.success) {
        setBookingSuccess(true);
      }
    } catch (err) {
      alert('Error booking consultation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const macroData = nutrition?.macros || {
    calories: 1450,
    targetCalories: 2000,
    protein: 52,
    targetProtein: 65,
    carbs: 180,
    targetCarbs: 230,
    fats: 38,
    targetFats: 50
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Nutrition & Wellness Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  Satvik Fit
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Live macro breakdown & 1-on-1 consultations with verified Satvik dietitians
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

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-100 dark:border-stone-800 px-5 pt-3 bg-white dark:bg-stone-900">
          <button
            onClick={() => setTab('tracker')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
              tab === 'tracker'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Today&apos;s Meal Nutrition</span>
          </button>

          <button
            onClick={() => setTab('consult')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
              tab === 'consult'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Expert Dietitian Consult</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {tab === 'tracker' ? (
            <div className="space-y-4">
              {/* Calorie Ring Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Daily Calories Ingested
                  </span>
                  <div className="text-2xl font-black text-stone-900 dark:text-white flex items-baseline gap-1 mt-0.5">
                    <span>{macroData.calories}</span>
                    <span className="text-xs text-stone-500">/ {macroData.targetCalories} kcal</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    On track &bull; Low glycemic index satvik meals
                  </p>
                </div>

                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Flame className="w-7 h-7" />
                </div>
              </div>

              {/* Macro Bars */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-center">
                  <div className="text-[10px] font-bold uppercase text-stone-400">Protein</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {macroData.protein}g
                  </div>
                  <div className="text-[10px] text-stone-500">Target: {macroData.targetProtein}g</div>
                </div>

                <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-center">
                  <div className="text-[10px] font-bold uppercase text-stone-400">Carbs</div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {macroData.carbs}g
                  </div>
                  <div className="text-[10px] text-stone-500">Target: {macroData.targetCarbs}g</div>
                </div>

                <div className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-center">
                  <div className="text-[10px] font-bold uppercase text-stone-400">Healthy Fats</div>
                  <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {macroData.fats}g
                  </div>
                  <div className="text-[10px] text-stone-500">Target: {macroData.targetFats}g</div>
                </div>
              </div>

              {/* Recent Meal Breakdowns */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                  Logged Tiffin Meals
                </h4>
                {[
                  { name: 'Lunch: Gujarati Dal, Phulkas & Bhindi Masala', cal: 580, protein: '18g', tag: 'High Fiber' },
                  { name: 'Breakfast: Sprouted Moong & Vegetable Poha', cal: 320, protein: '14g', tag: 'Low GI' },
                  { name: 'Upcoming Dinner: Khichdi, Kadhi & Roasted Papad', cal: 550, protein: '20g', tag: 'Sattvic Gut Cleanse' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                      <div className="text-[11px] text-stone-500">{item.cal} kcal &bull; {item.protein} protein</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Dietitian Booking Tab */
            <div className="space-y-4">
              {bookingSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base">Consultation Reserved!</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Your certified clinical nutritionist has received your meal history and health goals. A video consultation link has been sent via SMS/Email.
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold"
                  >
                    Book Another Slot
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                      Choose Certified Dietitian
                    </label>
                    <div className="space-y-2">
                      {dietitians.map((d) => (
                        <label
                          key={d.dietitianId}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            selectedDietitianId === d.dietitianId
                              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                              : 'border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="dietitian"
                              checked={selectedDietitianId === d.dietitianId}
                              onChange={() => setSelectedDietitianId(d.dietitianId)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-bold text-xs">{d.name}</div>
                              <div className="text-[10px] text-stone-500">
                                {d.specialization} &bull; {d.experienceYears}y exp &bull; {d.rating}★
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-600">
                            {d.consultationFee === 0 ? 'FREE with Subscription' : `₹${d.consultationFee}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Preferred Consultation Slot
                    </label>
                    <select
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Tomorrow, 11:00 AM">Tomorrow, 11:00 AM</option>
                      <option value="Tomorrow, 4:00 PM">Tomorrow, 4:00 PM</option>
                      <option value="Friday, 6:30 PM">Friday, 6:30 PM</option>
                      <option value="Saturday, 10:00 AM">Saturday, 10:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Health Goals / Dietary Restrictions
                    </label>
                    <textarea
                      rows={2}
                      value={healthGoals}
                      onChange={(e) => setHealthGoals(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider transition shadow"
                  >
                    {loading ? 'Confirming...' : 'Schedule 1-on-1 Nutritionist Consult'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
