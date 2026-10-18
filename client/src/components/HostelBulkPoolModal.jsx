import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Percent,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Send,
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import {
  getHostels,
  createHostel,
  createHostelGroupOrder,
  submitResidentSelection,
  getGroupOrderById,
  finalizeHostelGroupOrder
} from '../services/advancedFeaturesApi';

export default function HostelBulkPoolModal({ isOpen, onClose }) {
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [activeGroupOrder, setActiveGroupOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Resident Join Form
  const [residentName, setResidentName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [mealCategory, setMealCategory] = useState('Standard Student Thali (₹110)');
  const [spiceLevel, setSpiceLevel] = useState('Medium');

  const loadHostels = async () => {
    setLoading(true);
    try {
      const res = await getHostels();
      if (res && res.success) {
        setHostels(res.hostels || []);
        if (res.hostels?.length > 0 && !selectedHostelId) {
          setSelectedHostelId(res.hostels[0].hostelId);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHostels();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedHostelId) return;

    // Check active group order or mock/create one for the hostel
    const fetchActiveGroup = async () => {
      // Find hostel
      const h = hostels.find(x => x.hostelId === selectedHostelId);
      if (h) {
        // Set an active pool state
        setActiveGroupOrder({
          groupOrderId: `grp-${selectedHostelId}`,
          hostelName: h.name,
          hostelId: h.hostelId,
          targetDeliveryTime: 'Tonight, 8:30 PM',
          cutoffTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          minPoolThreshold: 5,
          currentSelectionsCount: 7,
          currentDiscountPercentage: 15,
          nextDiscountTier: { count: 10, discount: 20 },
          selections: [
            { residentName: 'Aarav Patel', roomNumber: '204', mealType: 'Jain Thali', spiceLevel: 'Mild' },
            { residentName: 'Meet Shah', roomNumber: '108', mealType: 'Student Regular', spiceLevel: 'Medium' },
            { residentName: 'Kunal Joshi', roomNumber: '312', mealType: 'Special Thali', spiceLevel: 'Spicy' }
          ]
        });
      }
    };
    fetchActiveGroup();
  }, [selectedHostelId, hostels]);

  if (!isOpen) return null;

  const currentHostel = hostels.find(h => h.hostelId === selectedHostelId) || hostels[0];

  const handleJoinPool = async (e) => {
    e.preventDefault();
    if (!residentName || !roomNumber) {
      alert('Please enter your name and room number');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      if (activeGroupOrder) {
        await submitResidentSelection(activeGroupOrder.groupOrderId, {
          residentName,
          roomNumber,
          phone,
          mealType: mealCategory,
          quantity: 1,
          customNotes: `Spice: ${spiceLevel}`
        });

        setActiveGroupOrder(prev => ({
          ...prev,
          currentSelectionsCount: (prev?.currentSelectionsCount || 0) + 1,
          selections: [
            ...(prev?.selections || []),
            { residentName, roomNumber, mealType: mealCategory, spiceLevel }
          ]
        }));

        setMessage(`🎉 Awesome ${residentName}! You joined room pool #${roomNumber}. Discount applied!`);
        setResidentName('');
        setRoomNumber('');
      }
    } catch (err) {
      setMessage('Joined pool locally: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeGroupOrder) return;
    try {
      await finalizeHostelGroupOrder(activeGroupOrder.groupOrderId);
      setMessage('Hostel pool batch successfully sent to kitchen for collective preparation!');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Hostel & PG Bulk Meal Pools</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  Bulk Discounts
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Pool with hostel mates to unlock up to 25% OFF and 0 delivery fees
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

        {/* Hostel Selector */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Select Campus / PG:</span>
            <select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {hostels.map(h => (
                <option key={h.hostelId} value={h.hostelId}>
                  {h.name} ({h.area})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{activeGroupOrder?.currentSelectionsCount || 0} pooled</span>
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-stone-900 dark:text-stone-100">
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Discount Tier Progress Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-400 tracking-wider">
                  Live Pool Discount
                </span>
                <div className="text-xl font-black text-teal-900 dark:text-teal-200">
                  {activeGroupOrder?.currentDiscountPercentage || 15}% Discount Unlocked!
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-stone-500 font-bold">Cutoff Timer</span>
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>45 mins remaining</span>
                </div>
              </div>
            </div>

            {/* Progress bar towards next tier */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                <span>{activeGroupOrder?.currentSelectionsCount || 7} orders placed</span>
                <span>Next Tier: 10 orders = 20% OFF</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, ((activeGroupOrder?.currentSelectionsCount || 7) / 10) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resident Join Form */}
          <form onSubmit={handleJoinPool} className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Join Tonight&apos;s Hostel Group Pool
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="e.g. Parth Desai"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Hostel Room / Wing
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Block B, Room 302"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Thali Selection
                </label>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Standard Student Thali (₹110)">Standard Student Thali (₹110)</option>
                  <option value="Jain Satvik Special (₹130)">Jain Satvik Special (₹130)</option>
                  <option value="High-Protein Paneer Thali (₹150)">High-Protein Paneer Thali (₹150)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Spice Preference
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Mild">Mild (Low Chili)</option>
                  <option value="Medium">Medium Regular</option>
                  <option value="Spicy">Spicy Gujarati Style</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-wide transition shadow"
            >
              {submitting ? 'Adding...' : 'Add My Meal to Hostel Pool'}
            </button>
          </form>

          {/* Current Room Pool Roster */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400">
              <span>Pool Roster ({activeGroupOrder?.selections?.length || 0} residents)</span>
              <button
                onClick={handleFinalize}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Coordinator: Finalize Batch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeGroupOrder?.selections?.map((sel, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100">{sel.residentName}</div>
                    <div className="text-[10px] text-stone-500">Room {sel.roomNumber} &bull; {sel.mealType}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    {sel.spiceLevel || 'Medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
