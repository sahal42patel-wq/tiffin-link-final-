import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gavel,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Award,
  ShieldCheck,
  TrendingDown,
  X,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import {
  getRequestMatches,
  getRequestOffers,
  selectAuctionOffer,
  rematchRequest
} from '../services/advancedFeaturesApi';
import { getSocket } from '../services/socket';

export default function AuctionAndMatchingModal({ isOpen, onClose, request, onOrderPlaced }) {
  const [tab, setTab] = useState('auction'); // 'auction' | 'ai_matches'
  const [offers, setOffers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingOfferId, setSelectingOfferId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const requestId = request?._id || request?.id;

  const loadData = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const [offersRes, matchesRes] = await Promise.all([
        getRequestOffers(requestId),
        getRequestMatches(requestId)
      ]);

      if (offersRes && offersRes.success) {
        setOffers(offersRes.offers || []);
      }
      if (matchesRes && matchesRes.success) {
        setMatches(matchesRes.matches || []);
      }
    } catch (err) {
      console.log('Error loading auction/matches:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId) {
      loadData();
    }
  }, [isOpen, requestId]);

  // Realtime Socket listeners for new bids
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !requestId) return;

    const handleNewOffer = (data) => {
      if (data.requestId === requestId) {
        setOffers(prev => [data.offer, ...prev.filter(o => o.offerId !== data.offer.offerId)]);
      }
    };

    socket.on('offer:new', handleNewOffer);

    return () => {
      socket.off('offer:new', handleNewOffer);
    };
  }, [requestId]);

  if (!isOpen || !request) return null;

  const handleSelectOffer = async (offerId) => {
    setSelectingOfferId(offerId);
    try {
      const res = await selectAuctionOffer(offerId);
      if (res && res.success) {
        setSuccessMessage(`Offer accepted! Order placed with ${res.order?.tiffinName || 'kitchen'}.`);
        if (onOrderPlaced) onOrderPlaced(res.order);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      alert('Error selecting offer: ' + err.message);
    } finally {
      setSelectingOfferId(null);
    }
  };

  const handleTriggerRematch = async () => {
    setLoading(true);
    try {
      const res = await rematchRequest(requestId);
      if (res && res.success) {
        setMatches(res.matches || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400">
                Live Dynamic Dispatch
              </span>
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                #{request._id?.toString().slice(-6) || 'REQ'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">
              {request.mealType || 'Custom Meal Order'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Quantity: {request.quantity || 1} &bull; Target Budget: ₹{request.budget || 140}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-100 dark:border-stone-800 px-5 pt-3 bg-white dark:bg-stone-900">
          <button
            onClick={() => setTab('auction')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
              tab === 'auction'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Gavel className="w-4 h-4" />
            <span>Live Kitchen Bids ({offers.length})</span>
            {offers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setTab('ai_matches')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative ${
              tab === 'ai_matches'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>AI Smart Kitchen Matches ({matches.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'auction' ? (
            /* Live Kitchen Bids / Offers Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>Verified home kitchens competing with custom deals</span>
                <span className="font-semibold">{offers.length} active offers</span>
              </div>

              {offers.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                    Awaiting Kitchen Bids
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                    Nearby kitchens are currently reviewing your custom menu preference. New bids will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer, idx) => {
                    const isLowest = idx === 0;
                    return (
                      <div
                        key={offer.offerId || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          offer.status === 'selected'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {offer.providerName || 'Local Home Chef'}
                              </h4>
                              {isLowest && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                  Best Price Deal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Ready in {offer.estimatedPrepMinutes || 25}m
                              </span>
                              <span>&bull;</span>
                              <span>Delivery: {offer.deliveryFee === 0 ? 'FREE' : `₹${offer.deliveryFee}`}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                              ₹{offer.offeredPrice}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Total: ₹{offer.totalAmount || offer.offeredPrice}
                            </div>
                          </div>
                        </div>

                        {offer.message && (
                          <div className="mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-700/50 text-xs text-stone-700 dark:text-stone-300">
                            &ldquo;{offer.message}&rdquo;
                          </div>
                        )}

                        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-700/70 flex items-center justify-between">
                          <span className="text-[11px] text-stone-400">
                            Expires in {Math.max(1, Math.floor(((new Date(offer.expiresAt) - Date.now()) / 1000) / 60))} mins
                          </span>

                          {offer.status === 'selected' ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Offer Selected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectOffer(offer.offerId)}
                              disabled={selectingOfferId === offer.offerId}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs tracking-wide shadow transition flex items-center gap-1.5"
                            >
                              {selectingOfferId === offer.offerId ? (
                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Accept & Order</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* AI Smart Provider Matching Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400">
                  Ranked by AI matching score (Hygiene, Proximity, Dietary Fit)
                </span>
                <button
                  onClick={handleTriggerRematch}
                  disabled={loading}
                  className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-evaluate Matches</span>
                </button>
              </div>

              {matches.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  Computing multi-dimensional provider suitability scores...
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match, i) => (
                    <div
                      key={match.providerId || i}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 hover:border-purple-400 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {match.kitchenName || 'Chef Partner'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {match.matchScore}% Match
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {match.distanceKm} km away
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-current" />
                              {match.rating || 4.8} ({match.hygieneScore || 96}% Hygiene)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ~{match.estimatedDeliveryMins || 25} Mins ETA
                          </span>
                        </div>
                      </div>

                      {/* Matching breakdown criteria */}
                      <div className="mt-3 grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 dark:border-stone-700 text-center">
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Cuisine</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.dietaryMatch || 30}/30
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Proximity</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.proximityScore || 22}/25
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Hygiene</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.ratingScore || 19}/20
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Reliability</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.speedScore || 14}/15
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
