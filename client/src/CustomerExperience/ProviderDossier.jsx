import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProviderDossier({
  provider,
  onBack,
  onSelectTiffin,
  customerCoordinates,
  customerAddress,
  onOpenLogin,
  currentUser
}) {
  const { currentUser: authUser } = useAuth();
  const user = currentUser || authUser;
  const [dbProvider, setDbProvider] = useState(provider || null);
  const [tiffins, setTiffins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetailsTiffin, setSelectedDetailsTiffin] = useState(null);

  const providerId = provider?._id || provider?.id;

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    const fetchDossierData = async () => {
      try {
        setLoading(true);
        if (!providerId) return;

        // 1. Fetch live provider details with real customer coordinates
        try {
          const uLat = customerCoordinates?.lat || 23.0300;
          const uLng = customerCoordinates?.lng || 72.5178;
          const pRes = await apiRequest(`/providers/${providerId}?lat=${uLat}&lng=${uLng}`);
          if (pRes?.success && pRes.data) {
            setDbProvider(pRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch provider details:', e);
        }

        // 2. Fetch live tiffins for this specific provider (Strict Isolation)
        try {
          const tRes = await apiRequest(`/tiffins?providerId=${providerId}`);
          if (tRes?.success && Array.isArray(tRes.data)) {
            setTiffins(tRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch tiffins for provider:', e);
        }
      } catch (err) {
        console.error('Error fetching dossier data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDossierData();
  }, [providerId, customerCoordinates?.lat, customerCoordinates?.lng]);

  const p = dbProvider || provider || {};
  const providerName = p.name || 'Kitchen Partner';
  const providerDesc = p.description || 'Authentic home-cooked meals prepared with care and fresh ingredients.';
  const dynamicKitchenPhoto = p.kitchenPhoto || p.kitchenPhotos || p.image;
  const providerImg = dynamicKitchenPhoto || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  const fssai = p.fssaiNumber || '—';
  const rating = p.rating || 0;
  const reviewCount = p.reviewCount || 0;

  // Dynamic Distance & Corridor Calculation
  const distanceKm = useMemo(() => {
    if (p.distanceKm && Number(p.distanceKm) > 0) {
      return Number(p.distanceKm);
    }
    if (provider?.distanceKm && Number(provider.distanceKm) > 0) {
      return Number(provider.distanceKm);
    }
    const pLat = p.address?.lat || p.location?.lat;
    const pLng = p.address?.lng || p.location?.lng;
    const uLat = customerCoordinates?.lat || 23.0300;
    const uLng = customerCoordinates?.lng || 72.5178;
    if (pLat && pLng && uLat && uLng) {
      const R = 6371;
      const dLat = (pLat - uLat) * (Math.PI / 180);
      const dLon = (pLng - uLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(uLat * (Math.PI / 180)) * Math.cos(pLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculated = Number((R * c).toFixed(1));
      if (calculated >= 0.8) return calculated;
    }
    return 1.8;
  }, [p, provider, customerCoordinates]);

  const etaMinutes = p.etaMinutes || Math.max(20, Math.round(15 + distanceKm * 5));
  const etaText = p.eta || `${etaMinutes}–${etaMinutes + 10} MIN DELIVERY`;

  // Dynamic Meal Type Detection
  const isNonVeg = 
    (p.businessType && /non-?veg/i.test(p.businessType)) ||
    (p.cuisines && /non-?veg/i.test(p.cuisines)) ||
    (p.cuisine && /non-?veg/i.test(p.cuisine)) ||
    (p.tags && p.tags.some(t => /non-?veg/i.test(t)));
  const mealTypeHeading = isNonVeg ? "VEG & NON-VEG" : "100%";
  const mealTypeSub = isNonVeg ? "FRESH HOMESTYLE MEALS" : "PURE VEG HOME COOKED";

  const locality = p.address?.locality || p.city || 'Local Area';
  const street = p.address?.street || (typeof p.address === 'string' ? p.address : '') || 'Kitchen Address';
  const phone = p.mobile || p.phone || '—';
  const cuisines = (p.tags && p.tags.length > 0) ? p.tags.join(' / ') : (p.cuisines || p.cuisine || p.businessType || p.category || 'Home Food');

  const scrollToCatalog = () => {
    const el = document.getElementById('tiffin-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const featuredTiffin = tiffins.length > 0 ? tiffins[0] : null;

  const handleCustomize = (tif) => {
    if (!user) {
      if (typeof onOpenLogin === 'function') {
        onOpenLogin('login');
      }
      return;
    }
    if (tif) onSelectTiffin(tif);
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-20 sm:pt-24">
      {/* Minimalist Meta Header Bar & Nav Breadcrumb */}
      <section className="w-full bg-[#f5f3ef] px-4 sm:px-6 lg:px-20 py-4 border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#4a4238] text-white px-4 py-2 transition-all group cursor-pointer shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-button-text text-xs uppercase tracking-wider">Back to Providers</span>
            </button>
            <div className="h-5 w-px bg-[#ded9d1] hidden sm:block"></div>
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 font-label-caps text-xs text-[#665d52] uppercase font-semibold">
              <span className="hover:text-[#1a1a1a] cursor-pointer" onClick={() => { window.location.hash = '#home'; }}>Home</span>
              <span>/</span>
              <span className="hover:text-[#1a1a1a] cursor-pointer" onClick={onBack}>Providers</span>
              <span>/</span>
              <span>{locality}</span>
              <span>/</span>
              <span className="text-[#1a1a1a] font-bold">{providerName}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 shadow-xs border border-[#ded9d1] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="font-label-caps text-[11px] text-[#1a1a1a] tracking-widest uppercase font-semibold">ACCEPTING ORDERS</span>
            </div>
            <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold">
              DELIVERING IN {locality.toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Dossier Architectural Hero Canvas */}
      <section className="w-full bg-[#fbf9f5] px-4 sm:px-6 lg:px-20 pt-6 pb-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Visual Block */}
            <div className="lg:col-span-7 flex flex-col gap-6 relative">
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#efeeea] shadow-md border border-[#ded9d1]">
                <img
                  className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                  src={providerImg}
                  alt={providerName}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="bg-[#fbf9f5]/95 backdrop-blur-sm p-4 max-w-xs shadow-sm border border-[#ded9d1]">
                    <span className="font-label-caps text-[10px] text-[#665d52] block uppercase tracking-wider font-semibold">VERIFIED HOME KITCHEN</span>
                    <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-[20px] leading-tight text-[#1a1a1a] mt-1 font-semibold">
                      Authentic Home Kitchen
                    </p>
                    <p className="font-body-md text-xs text-[#665d52] mt-0.5">
                      {street}
                    </p>
                  </div>
                  <div className="bg-[#1a1a1a] text-[#fbf9f5] px-3 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#f5f3ef]">verified</span>
                    <span className="font-label-caps text-[10px] text-[#f5f3ef] tracking-widest uppercase font-semibold">FSSAI #{fssai}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Metric Strip */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#f5f3ef] p-4 flex flex-col justify-between border border-[#ded9d1]">
                  <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold">RATING</span>
                  <div className="mt-4">
                    <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] leading-none">
                      {rating}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[#1a1a1a]">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span className="font-label-caps text-[10px] uppercase font-bold">{reviewCount} CUSTOMER REVIEWS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f5f3ef] p-4 flex flex-col justify-between border border-[#ded9d1]">
                  <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold">DISTANCE &amp; TIME</span>
                  <div className="mt-4">
                    <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] leading-none">
                      {distanceKm}<span className="text-[16px] font-sans">km</span>
                    </p>
                    <p className="font-label-caps text-[10px] text-[#665d52] mt-1 uppercase font-semibold">{etaText}</p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] text-[#fbf9f5] p-4 flex flex-col justify-between">
                  <span className="font-label-caps text-xs text-[#ded9d1] uppercase font-semibold">MEAL TYPE</span>
                  <div className="mt-4">
                    <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-white leading-none">
                      {mealTypeHeading}
                    </p>
                    <p className="font-label-caps text-[10px] text-[#ded9d1] mt-1 uppercase font-bold">{mealTypeSub}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Informational & Dossier Profile Section */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 bg-[#efeeea] hover:bg-[#e4e2de] px-3 py-1 text-[#1a1a1a] border border-[#ded9d1] font-label-caps text-xs uppercase tracking-wider transition-colors cursor-pointer group font-bold mr-1"
                  >
                    <span className="material-symbols-outlined text-[15px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                    <span>Back to Providers</span>
                  </button>
                  <span className="font-label-caps text-xs bg-[#efeeea] px-2.5 py-1 text-[#1a1a1a] uppercase tracking-wider font-semibold border border-[#ded9d1]">KITCHEN PROFILE</span>
                  <span className="text-[#665d52]">•</span>
                  <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold">AHMEDABAD</span>
                </div>

                <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl lg:text-6xl text-[#1a1a1a] tracking-tight leading-[1.05]">
                  {providerName}
                </h1>
                
                <p className="font-body-lg text-sm sm:text-base text-[#665d52] mt-4 leading-relaxed">
                  {providerDesc}
                </p>
              </div>

              {/* Structured Fact Ledger */}
              <div className="space-y-3 bg-[#f5f3ef] p-5 shadow-sm border border-[#ded9d1]">
                <div className="flex justify-between items-start bg-white p-3.5 border border-[#ded9d1]/60">
                  <div>
                    <span className="font-label-caps text-[11px] text-[#665d52] uppercase block font-semibold">Cuisines &amp; Specialties</span>
                    <span className="font-body-md text-xs sm:text-sm text-[#1a1a1a] font-medium mt-0.5 block">{cuisines}</span>
                  </div>
                  <span className="material-symbols-outlined text-[#665d52] text-[20px]">restaurant_menu</span>
                </div>

                <div className="flex justify-between items-start bg-white p-3.5 border border-[#ded9d1]/60">
                  <div>
                    <span className="font-label-caps text-[11px] text-[#665d52] uppercase block font-semibold">Kitchen Location</span>
                    <span className="font-body-md text-xs sm:text-sm text-[#1a1a1a] font-medium mt-0.5 block">{street}</span>
                    <span className="font-label-caps text-[#665d52] text-[10px] uppercase">Area: {locality}</span>
                  </div>
                  <span className="material-symbols-outlined text-[#665d52] text-[20px]">pin_drop</span>
                </div>

                <div className="flex justify-between items-start bg-white p-3.5 border border-[#ded9d1]/60">
                  <div>
                    <span className="font-label-caps text-[11px] text-[#665d52] uppercase block font-semibold">Customer Care &amp; Inquiries</span>
                    <span className="font-body-md text-xs sm:text-sm text-[#1a1a1a] font-medium mt-0.5 block font-mono">{phone}</span>
                    <span className="font-label-caps text-[#665d52] text-[10px] uppercase">Service Hours: 07:00 AM – 09:00 PM</span>
                  </div>
                  <span className="material-symbols-outlined text-[#665d52] text-[20px]">call</span>
                </div>
              </div>

              {/* Primary Dossier CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="flex-1 bg-[#1a1a1a] text-[#fbf9f5] font-button-text text-xs uppercase tracking-widest text-center py-4 px-6 hover:bg-[#4a4238] transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  <span>View All Tiffins</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>

                <button
                  type="button"
                  disabled={!featuredTiffin}
                  onClick={() => handleCustomize(featuredTiffin)}
                  className={`flex-1 ${featuredTiffin ? 'bg-[#efeeea] hover:bg-[#e4e2de] text-[#1a1a1a] cursor-pointer' : 'bg-[#f5f3ef] text-[#a0988c] cursor-not-allowed'} font-button-text text-xs uppercase tracking-widest text-center py-4 px-6 transition-colors flex items-center justify-center gap-2 font-bold border border-[#ded9d1]`}
                >
                  <span>Customize Featured</span>
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Quality & Hygiene Guarantee Banner */}
      <section className="w-full bg-[#ded9d1]/30 py-5 px-4 sm:px-6 lg:px-20 border-y border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#1b5e20] text-[24px]">verified</span>
            <div>
              <span className="font-label-caps text-xs text-[#1a1a1a] uppercase tracking-wider block font-bold">100% Homestyle Hygiene &amp; Quality</span>
              <p className="font-body-md text-xs text-[#665d52]">
                Cooked with care in clean, family-run kitchens using fresh farm vegetables and pure ingredients.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3 py-1.5 shadow-xs border border-[#ded9d1]">
            <span className="material-symbols-outlined text-[16px] text-[#1b5e20]">check_circle</span>
            <span className="font-label-caps text-[11px] text-[#1a1a1a] tracking-widest uppercase font-semibold">FSSAI VERIFIED KITCHEN</span>
          </div>
        </div>
      </section>

      {/* Section: Catalog of Tiffins Isolated to this Provider */}
      <section className="w-full bg-[#fbf9f5] px-4 sm:px-6 lg:px-20 py-16" id="tiffin-catalog">
        <div className="max-w-[1440px] mx-auto">
          {/* Section Editorial Title Grid */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#ded9d1] gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest font-semibold">SECTION 02</span>
                <span className="text-[#665d52]">•</span>
                <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest font-semibold">CULINARY PORTFOLIO</span>
              </div>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight">
                Available Tiffins from {providerName}
              </h2>
            </div>
            <p className="font-body-md text-xs sm:text-sm text-[#665d52] max-w-md leading-relaxed">
              Rotated daily following seasonal principles. All tiffins include freshly prepared dairy, produce, and hand-rolled flatbreads in 304 stainless steel canisters.
            </p>
          </div>

          {/* Tiffins Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white border border-[#ded9d1]">
              <div className="w-8 h-8 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-label-caps text-xs uppercase text-[#665d52]">Loading fresh tiffins...</p>
            </div>
          ) : tiffins.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#ded9d1] space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#665d52]">lunch_dining</span>
              <p className="text-base text-[#1a1a1a] font-medium">No tiffins currently active for this kitchen.</p>
              <button onClick={onBack} className="px-4 py-2 bg-[#1a1a1a] text-white text-xs uppercase font-bold">
                Return to All Providers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {tiffins.map((tif, idx) => {
                const tifImg = tif.image && tif.image.startsWith('http') 
                  ? tif.image 
                  : (idx === 0 
                      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMu_TVgTec0S1wQHIMMwrELkw3t1LX664GkNNa9BT258VzR9SyXuP-XB5KYIGq_KZVXp1A5qIcS4ooyOIfdEsA87ygeKHaE6foMiv-C3yyM21VcGBWEnvu8WvL-RQFZZCXkE0OTNxmoEQF_tdo0sj5L0-0wTY238PdytDxl_KerGP8fiigXMye8nczTLWNQYaTsD1-Ud3QDfxvSghCcVy1TIzjU_6sLPwbEMb1Ras9rHO-tsMIYxzw'
                      : (idx === 1
                          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuALL9P29qX9nOtbETPkhsF7OUY2W71CC0_9a8ppDvyo3i2vxr6eYZYntKAPbcic9zhmHV-owfYPnQRQ_owyF0lStSEDGWUX04L3qL_rRh3dGx7cpn32PysFzvw6f_vJNWOyI6Xa0B-9y5HA5duroMhxIn1kCqlFthQF9t_JyKm6Q7a0SuDoY_9f5HAb-WRkMZQ4W2BV06zUSTY8EkoJ9TyWcJKYJYh4WLlNtle0tAUrnTE6xOO4Mg37'
                          : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs5gW8mHVYuHPeX_s8wbG8BUkrPtLAPxqCAnZ5RHS4ETkuyWSw53l-ieyvAcaZ2aYbCUB245YvCVE3pliclCnrT1shVrCjIOb_Iu46Y5p-zfOonLcB_BB_A9RPIEfHGA-vcOYJJZhTTczbpqhOLgLw5qmAdDI1nXj8sDj9eed8SUyMmZBueoH-KgF4cl02MiPqz4xv3ZhSkoPZNKTbn3zX-o4IR_A5yH2qS4Fw848zBCaSGfm0CGrv'));

                const compositionList = Array.isArray(tif.items) && tif.items.length > 0 
                  ? tif.items 
                  : (tif.ingredients ? tif.ingredients.split(',').map(s => s.trim()).filter(Boolean) : []);

                return (
                  <article key={tif._id} className="bg-white flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow border border-[#ded9d1] group">
                    <div>
                      {/* Visual Canvas */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#efeeea]">
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={tifImg}
                          alt={tif.name}
                        />
                        <div className="absolute top-4 left-4 bg-[#1a1a1a] text-[#fbf9f5] px-3 py-1 font-label-caps text-[10px] uppercase tracking-wider font-bold">
                          {tif.category || 'POPULAR TIFFIN'}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-white/95 px-3 py-1 shadow-xs font-label-caps text-[10px] text-[#1a1a1a] font-bold">
                          {tif.available !== undefined ? tif.available : (tif.capacity || 0)} MEALS REMAINING
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-6 sm:p-7">
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight font-medium">
                            {tif.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="font-label-caps text-xs text-[#8c531b] uppercase tracking-wider font-bold bg-[#fcf6ee] px-2.5 py-1 rounded border border-[#eedcc8] whitespace-nowrap block">
                              Custom Pricing
                            </span>
                            <span className="font-body-md text-[11px] text-[#665d52] block mt-0.5">
                              Build Your Meal
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="bg-[#efeeea] px-2.5 py-0.5 font-label-caps text-[10px] text-[#1a1a1a] uppercase font-semibold">
                            {tif.foodType || 'Veg'}
                          </span>
                          <span className="bg-[#efeeea] px-2.5 py-0.5 font-label-caps text-[10px] text-[#1a1a1a] uppercase">
                            {tif.mealType || 'Lunch'}
                          </span>
                          <span className="bg-[#ded9d1] px-2.5 py-0.5 font-label-caps text-[10px] text-[#1a1a1a] uppercase font-bold">
                            Today's Fresh Batch
                          </span>
                        </div>

                        {/* Description & Custom Meal Pricing Note */}
                        <div className="mb-4">
                          <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                            {tif.description ? `${tif.description} ` : ''}
                            <span className="inline-block mt-1 text-[#8c531b] font-medium bg-[#fcf6ee] px-2 py-0.5 rounded border border-[#eedcc8]">
                              ✨ Select items & build your customized meal
                            </span>
                          </p>
                        </div>

                        {/* Composition Box */}
                        <div className="bg-[#f5f3ef] p-4 space-y-2 border border-[#ded9d1]/60">
                          <span className="font-label-caps text-[11px] text-[#665d52] block uppercase font-bold">Tiffin Includes</span>
                          <ul className="font-body-md text-xs text-[#1a1a1a] space-y-1.5 list-none">
                            {compositionList.slice(0, 4).map((cItem, cIdx) => (
                              <li key={cIdx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full shrink-0"></span>
                                <span className="truncate">{cItem}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="p-6 sm:p-7 pt-0 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleCustomize(tif)}
                        className="w-full bg-[#1a1a1a] hover:bg-[#4a4238] text-white py-3.5 px-4 font-button-text text-xs uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
                      >
                        <span>CUSTOMIZE MEAL</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDetailsTiffin(tif)}
                        className="w-full bg-[#efeeea] hover:bg-[#ded9d1] text-[#1a1a1a] py-2.5 px-4 font-button-text text-xs uppercase tracking-widest text-center transition-colors cursor-pointer border border-[#ded9d1]"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hygiene, Material Protocols & Logistics Architecture */}
      <section className="w-full bg-[#f5f3ef] px-4 sm:px-6 lg:px-20 py-16 border-t border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block mb-1 font-semibold">OUR PROMISE</span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight">
                Hygiene &amp; Quality Commitments
              </h2>
            </div>
            <span className="font-label-caps text-xs text-[#665d52] uppercase">FRESH &amp; HYGIENIC DELIVERIES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 flex flex-col justify-between shadow-xs border border-[#ded9d1]">
              <div>
                <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[20px]">layers</span>
                </div>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mb-2 font-medium">
                  304 Stainless Steel Loop
                </h3>
                <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                  Never packaged in single-use petrochemical plastics. Transported in calibrated, multi-tier food-grade 304 stainless steel dabbas collected and autoclaved daily.
                </p>
              </div>
              <div className="pt-4 mt-4 bg-[#f5f3ef] p-3 border border-[#ded9d1]/50">
                <span className="font-label-caps text-[10px] text-[#1a1a1a] uppercase tracking-wider block font-bold">Zero-Waste Canister Loop</span>
                <span className="font-label-caps text-[9px] text-[#665d52] uppercase">Deposit-Free Architecture</span>
              </div>
            </div>

            <div className="bg-white p-6 flex flex-col justify-between shadow-xs border border-[#ded9d1]">
              <div>
                <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[20px]">device_thermostat</span>
                </div>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mb-2 font-medium">
                  Thermal Lock (&gt;65°C)
                </h3>
                <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                  Infrared thermometer verification conducted at the packing line. Guaranteed core dispatch temperature exceeding 65°C upon courier handoff.
                </p>
              </div>
              <div className="pt-4 mt-4 bg-[#f5f3ef] p-3 border border-[#ded9d1]/50">
                <span className="font-label-caps text-[10px] text-[#1a1a1a] uppercase tracking-wider block font-bold">Verified Safe Seal</span>
                <span className="font-label-caps text-[9px] text-[#665d52] uppercase">Real-Time Core Probe Logging</span>
              </div>
            </div>

            <div className="bg-white p-6 flex flex-col justify-between shadow-xs border border-[#ded9d1]">
              <div>
                <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[20px]">sanitizer</span>
                </div>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mb-2 font-medium">
                  Daily RO Sanitation
                </h3>
                <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                  All produce undergoes ultrasonic ozone washing; cooking utilizes multi-stage reverse osmosis water to preserve purity and natural flavours.
                </p>
              </div>
              <div className="pt-4 mt-4 bg-[#f5f3ef] p-3 border border-[#ded9d1]/50">
                <span className="font-label-caps text-[10px] text-[#1a1a1a] uppercase tracking-wider block font-bold">FSSAI Certified Unit</span>
                <span className="font-label-caps text-[9px] text-[#665d52] uppercase">Bi-Weekly Laboratory Swabs</span>
              </div>
            </div>

            <div className="bg-white p-6 flex flex-col justify-between shadow-xs border border-[#ded9d1]">
              <div>
                <div className="w-10 h-10 bg-[#1a1a1a] text-white flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                </div>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mb-2 font-medium">
                  {distanceKm}km Hyper-Local Radius
                </h3>
                <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                  Deliveries are restricted to Satellite and immediate contiguous sub-zones to ensure that fresh rotlis never suffer steam condensation or rigidity.
                </p>
              </div>
              <div className="pt-4 mt-4 bg-[#f5f3ef] p-3 border border-[#ded9d1]/50">
                <span className="font-label-caps text-[10px] text-[#1a1a1a] uppercase tracking-wider block font-bold">Dedicated Runners</span>
                <span className="font-label-caps text-[9px] text-[#665d52] uppercase">Direct Kitchen-To-Table Route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Specification Sheet Modal */}
      {selectedDetailsTiffin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-8 shadow-2xl relative border border-[#ded9d1]">
            <div className="flex justify-between items-start mb-6 pb-3 bg-[#f5f3ef] p-4 border border-[#ded9d1]">
              <div>
                <span className="font-label-caps text-xs text-[#665d52] uppercase block font-semibold">TIFFIN SPECIFICATION SHEET</span>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight mt-1 font-semibold">
                  {selectedDetailsTiffin.name} (Custom Pricing)
                </h3>
              </div>
              <button
                className="text-[#1a1a1a] hover:text-[#665d52] p-1 cursor-pointer"
                onClick={() => setSelectedDetailsTiffin(null)}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#fcf6ee] p-4 border border-[#eedcc8]">
                <span className="font-label-caps text-xs text-[#8c531b] uppercase block mb-1 font-bold">Item-Based Custom Pricing</span>
                <p className="font-body-md text-xs text-[#1a1a1a] leading-relaxed">
                  {selectedDetailsTiffin.description || 'Authentic traditional home-cooked meal.'}
                </p>
                <p className="font-body-md text-xs text-[#8c531b] font-medium mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Select items and portion quantities to build your favorite meal. Final price is computed dynamically from chosen items.</span>
                </p>
              </div>

              <div className="bg-[#f5f3ef] p-4 border border-[#ded9d1]/60">
                <span className="font-label-caps text-xs text-[#665d52] uppercase block mb-1 font-bold">Standard Tray Composition</span>
                <p className="font-body-md text-xs text-[#1a1a1a] leading-relaxed">
                  {Array.isArray(selectedDetailsTiffin.items) && selectedDetailsTiffin.items.length > 0 
                    ? selectedDetailsTiffin.items.join(' • ')
                    : (selectedDetailsTiffin.ingredients || 'Standard seasonal thali composition.')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f5f3ef] p-3 border border-[#ded9d1]/60">
                  <span className="font-label-caps text-[10px] text-[#665d52] uppercase block font-semibold">Caloric Estimate</span>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a]">620 - 710 kcal</span>
                </div>
                <div className="bg-[#f5f3ef] p-3 border border-[#ded9d1]/60">
                  <span className="font-label-caps text-[10px] text-[#665d52] uppercase block font-semibold">Canister Type</span>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a]">4-Tier Steel 304</span>
                </div>
              </div>

              <div className="bg-[#f5f3ef] p-4 border border-[#ded9d1]/60">
                <span className="font-label-caps text-xs text-[#665d52] uppercase block mb-1 font-bold">Allergen Notice</span>
                <p className="font-body-md text-xs text-[#665d52] leading-relaxed">
                  Prepared in a dedicated 100% pure vegetarian satellite kitchen. Contains whole wheat (gluten) and dairy (pure ghee and buttermilk). Zero trans-fats.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <button
                className="bg-[#efeeea] text-[#1a1a1a] px-5 py-2.5 font-button-text text-xs uppercase tracking-wider font-semibold border border-[#ded9d1]"
                onClick={() => setSelectedDetailsTiffin(null)}
              >
                Close Specification
              </button>
              <button
                className="bg-[#1a1a1a] text-white px-6 py-2.5 font-button-text text-xs uppercase tracking-wider font-semibold hover:bg-[#4a4238]"
                onClick={() => {
                  const t = selectedDetailsTiffin;
                  setSelectedDetailsTiffin(null);
                  onSelectTiffin(t);
                }}
              >
                Customize This Tiffin →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
