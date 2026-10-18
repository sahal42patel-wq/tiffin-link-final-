import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Info, X, ExternalLink, Check, Bell } from 'lucide-react';
import { getActiveBroadcasts, acknowledgeBroadcast, dismissBroadcast } from '../services/advancedFeaturesApi';
import { getSocket } from '../services/socket';

export default function HyperlocalBroadcastBanner({ userRole = 'all' }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchBroadcasts = async () => {
    try {
      const res = await getActiveBroadcasts(userRole);
      if (res && res.success && Array.isArray(res.broadcasts)) {
        setBroadcasts(res.broadcasts);
      }
    } catch (err) {
      console.log('Broadcasts fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchBroadcasts();

    // Listen for real-time broadcasts
    const socket = getSocket();
    if (socket) {
      const handleNewBroadcast = (newBc) => {
        setBroadcasts(prev => [newBc, ...prev.filter(b => b.broadcastId !== newBc.broadcastId)]);
      };
      socket.on('broadcast:new', handleNewBroadcast);
      return () => {
        socket.off('broadcast:new', handleNewBroadcast);
      };
    }
  }, [userRole]);

  if (!broadcasts || broadcasts.length === 0) return null;

  const activeBc = broadcasts[currentIndex] || broadcasts[0];

  const handleDismiss = async () => {
    try {
      await dismissBroadcast(activeBc.broadcastId);
    } catch (e) {}
    setBroadcasts(prev => prev.filter(b => b.broadcastId !== activeBc.broadcastId));
    if (currentIndex >= broadcasts.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeBroadcast(activeBc.broadcastId);
    } catch (e) {}
    handleDismiss();
  };

  const isEmergency = activeBc.priority === 'urgent' || activeBc.category === 'emergency_alert';

  return (
    <div
      className={`relative z-40 px-4 py-2.5 text-xs sm:text-sm font-medium transition-all shadow-md ${
        isEmergency
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white animate-pulse'
          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 dark:text-stone-900'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-full bg-white/20 shrink-0">
            {isEmergency ? (
              <AlertCircle className="w-4 h-4 text-white" />
            ) : (
              <Megaphone className="w-4 h-4 text-slate-900" />
            )}
          </div>
          <div className="truncate">
            <span className="font-bold uppercase tracking-wider text-[11px] opacity-90 mr-2 px-1.5 py-0.5 rounded bg-black/15">
              {activeBc.targetAreaName || 'Area Broadcast'}
            </span>
            <span className="font-semibold">{activeBc.title}:</span>{' '}
            <span className="opacity-95">{activeBc.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeBc.actionUrl && (
            <a
              href={activeBc.actionUrl}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/30 hover:bg-white/40 font-semibold transition text-xs"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleAcknowledge}
            className="px-2.5 py-1 rounded-full bg-black/20 hover:bg-black/30 font-semibold transition text-xs flex items-center gap-1"
            title="Mark as Read"
          >
            <Check className="w-3 h-3" />
            <span className="hidden md:inline">Got it</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-black/20 transition opacity-80 hover:opacity-100"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
