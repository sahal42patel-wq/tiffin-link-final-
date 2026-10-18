import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  MapPin,
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Heart,
  Briefcase,
  Flame,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { createEmergencyMealRequest, getEmergencyRequestStatus } from '../services/advancedFeaturesApi';
import { getSocket } from '../services/socket';

export default function EmergencyMealModal({ isOpen, onClose, defaultAddress = '' }) {
  const [step, setStep] = useState('form'); // 'form' | 'tracking'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress || 'Satellite, Ahmedabad');
  const [mealCategory, setMealCategory] = useState('Pure Veg');
  const [reason, setReason] = useState('elderly_medical');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Active Emergency tracking
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 minutes SLA

  useEffect(() => {
    if (defaultAddress) setDeliveryAddress(defaultAddress);
  }, [defaultAddress]);

  // SLA Timer Countdown
  useEffect(() => {
    if (step !== 'tracking' || !activeEmergency) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, activeEmergency]);

  // Socket updates for emergency request fulfillment
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeEmergency) return;

    const handleAccepted = (data) => {
      if (data.requestId === activeEmergency.mealRequestId || data.emergencyId === activeEmergency.emergencyId) {
        setActiveEmergency(prev => ({
          ...prev,
          status: 'fulfilled',
          assignedProviderName: data.providerName || 'Express Kitchen Hub'
        }));
      }
    };

    socket.on('emergency:accepted', handleAccepted);
    socket.on('request:accepted', handleAccepted);

    return () => {
      socket.off('emergency:accepted', handleAccepted);
      socket.off('request:accepted', handleAccepted);
    };
  }, [activeEmergency]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!customerPhone || customerPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number for express driver coordination.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: customerName || 'Express Diner',
        customerPhone,
        customerAddress: deliveryAddress,
        coordinates: [72.5178, 23.0300], // Default Ahmedabad
        reason,
        mealType: `Express ${mealCategory} Thali`,
        quantity: Number(quantity) || 1,
        dietaryRestrictions: [mealCategory],
        maxWaitMinutes: 30,
        specialNotes: notes
      };

      const res = await createEmergencyMealRequest(payload);
      if (res && res.success) {
        setActiveEmergency(res.emergencyRequest);
        setSecondsRemaining((res.emergencyRequest?.maxWaitMinutes || 30) * 60);
        setStep('tracking');
      } else {
        setError(res?.message || 'Emergency dispatch could not be queued at this moment.');
      }
    } catch (err) {
      setError(err.message || 'Error creating emergency request');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-red-500/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Zap className="w-6 h-6 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">SOS Express Meal Dispatch</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-red-700 uppercase tracking-widest shadow-sm">
                  30-Min SLA
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                High-priority queue for medical, elderly, & urgent hunger needs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-900 dark:text-stone-100">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Urgency Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  Emergency Priority Category
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'elderly_medical', label: 'Patient / Elderly Care', icon: Heart, desc: 'Mild, easily digestible' },
                    { id: 'sudden_hunger', label: 'Late Night / Urgent', icon: Flame, desc: 'Hot, freshly packed' },
                    { id: 'office_meeting', label: 'Executive Meeting', icon: Briefcase, desc: 'Premium corporate pack' },
                    { id: 'other', label: 'Other Urgent Need', icon: Sparkles, desc: 'Express turnaround' }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = reason === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setReason(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-stone-400'}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-red-600" />}
                        </div>
                        <div className="font-bold text-xs">{cat.label}</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary preference & quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Dietary Requirement
                  </label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Pure Veg">Pure Vegetarian</option>
                    <option value="Jain">100% Jain (No Onion/Garlic/Root)</option>
                    <option value="Swaminarayan">Swaminarayan Satvik</option>
                    <option value="Diabetic Friendly">Diabetic Low GI / Mild Salt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Thali Quantity
                  </label>
                  <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-800 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 font-bold hover:bg-stone-200 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-xs">{quantity} Thali</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-700 font-bold hover:bg-stone-200 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Contact */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Delivery Destination
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Flat No, Landmark, Area"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      Contact Mobile
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Mehta"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Special Medical / Food Instructions
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. No chillies, soft rotis for elderly patient"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Express Guarantee Badge */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    Express Dispatch Priority:
                  </span>{' '}
                  <span className="text-amber-800 dark:text-amber-400">
                    Bypasses standard scheduling, directly alerting the nearest active home kitchens within 5 km.
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-500/25 hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                    <span>Broadcast SOS Meal Dispatch (₹{quantity * 160})</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Live SLA Tracking Radar View */
            <div className="space-y-6 text-center py-2">
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-red-500/40 animate-spin" />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white flex flex-col items-center justify-center shadow-xl">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-80">SLA Timer</span>
                  <span className="text-2xl font-black font-mono">{formatTimer(secondsRemaining)}</span>
                  <span className="text-[9px] text-red-200">Minutes Left</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold">
                  {activeEmergency?.status === 'fulfilled'
                    ? '🎉 Kitchen Partner Confirmed!'
                    : 'Dispatch Radar Active'}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                  {activeEmergency?.status === 'fulfilled'
                    ? `Order accepted by ${activeEmergency.assignedProviderName}. Preparation is underway.`
                    : 'Alerted 8 nearby verified home-kitchens within 4.5 km of Satellite.'}
                </p>
              </div>

              {/* Status Stepper */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold">SOS Broadcast Dispatched</span>
                    <p className="text-[10px] text-stone-500">Target ETA &lt; 30 minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    activeEmergency?.status === 'fulfilled' ? 'bg-emerald-500 text-white' : 'bg-amber-500/20 text-amber-600 animate-pulse'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold">
                      {activeEmergency?.status === 'fulfilled' ? 'Kitchen Assigned' : 'Awaiting Kitchen Confirmation'}
                    </span>
                    <p className="text-[10px] text-stone-500">
                      {activeEmergency?.status === 'fulfilled' ? 'Express packaging initiated' : 'Matching with highest hygiene-rated kitchen'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs opacity-70">
                    <span className="font-bold">Express Rider Assigned</span>
                    <p className="text-[10px] text-stone-500">Direct non-stop delivery to your doorstep</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Edit Request
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold hover:opacity-90 transition"
                >
                  Keep Tracking in Background
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
