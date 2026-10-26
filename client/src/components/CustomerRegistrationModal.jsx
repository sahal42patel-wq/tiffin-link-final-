import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, setAuthTokens, saveUserSession } from '../services/api';

export default function CustomerRegistrationModal({
  isOpen,
  onClose,
  onOpenLogin,
  onRegistrationSuccess,
  onOpenLegalModal
}) {
  const { login } = useAuth();

  // Wizard Step: 1, 2, 3, 4, 5 (Success)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Step 2: Secure Your Account
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: Delivery Address
  const [buildingFlat, setBuildingFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [pinCode, setPinCode] = useState('');

  // Step 4: Consents
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [thermalAlerts, setThermalAlerts] = useState(true);

  // UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSubmitError('');
      setErrors({});
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Password criteria evaluation
  const hasMin8 = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!fullName || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full legal name (at least 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress || !emailRegex.test(emailAddress.trim())) {
      errs.emailAddress = 'Please enter a valid email address';
    }
    const phoneClean = mobileNumber.replace(/[^0-9]/g, '');
    if (!phoneClean || phoneClean.length !== 10) {
      errs.mobileNumber = 'Please enter a valid 10-digit Indian mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs = {};
    if (!password) {
      errs.password = 'Password is required';
    } else if (!hasMin8 || !hasUpperLower || !hasNumber || !hasSpecial) {
      errs.password = 'Please satisfy all security criteria (8+ chars, upper & lower, number, symbol)';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs = {};
    if (!buildingFlat || buildingFlat.trim().length < 3) {
      errs.buildingFlat = 'Please specify your house, flat, or tower details';
    }
    if (!streetArea || streetArea.trim().length < 3) {
      errs.streetArea = 'Please enter your street or area name';
    }
    if (!city || city.trim().length < 2) {
      errs.city = 'City is required';
    }
    const cleanPin = pinCode.replace(/[^0-9]/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      errs.pinCode = 'Please enter a valid 6-digit PIN code';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 4 Validation
  const validateStep4 = () => {
    const errs = {};
    if (!agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms & Conditions and Privacy Policy';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    setSubmitError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setSubmitError('');
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepTitles = {
    1: 'Personal Details',
    2: 'Secure Your Account',
    3: 'Delivery Address',
    4: 'Verify Your Account'
  };

  const progressPercentages = {
    1: '25%',
    2: '50%',
    3: '75%',
    4: '100%'
  };

  const trackWidths = {
    1: '0%',
    2: '33.33%',
    3: '66.66%',
    4: '100%'
  };

  // Submit Registration to MongoDB Backend
  const handleSubmitRegistration = async () => {
    if (!validateStep4()) return;

    setIsSubmitting(true);
    setSubmitError('');

    const payload = {
      name: fullName.trim(),
      email: emailAddress.trim().toLowerCase(),
      phone: mobileNumber.replace(/[^0-9]/g, ''),
      password: password,
      role: 'customer',
      address: {
        buildingFlat: buildingFlat.trim(),
        streetArea: streetArea.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pinCode.trim(),
        label: 'Home'
      },
      directAuth: true
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        if (data.accessToken) {
          setAuthTokens(data.accessToken, data.refreshToken);
        }

        const rawUser = data.user || {
          email: payload.email,
          name: payload.name,
          phone: payload.phone,
          role: 'customer'
        };

        const authUser = {
          ...rawUser,
          id: String(rawUser._id || rawUser.id || ''),
          _id: String(rawUser._id || rawUser.id || ''),
          role: 'customer'
        };

        setCreatedUser(authUser);
        saveUserSession(authUser, data.accessToken, data.refreshToken);

        if (login) {
          try {
            await login(authUser, data.accessToken, data.refreshToken);
          } catch (e) {
            console.warn('Auth login hook sync note:', e);
          }
        }

        if (onRegistrationSuccess) {
          onRegistrationSuccess(authUser, data.accessToken, data.refreshToken);
        }

        // Advance to Success View
        setCurrentStep(5);
      } else {
        setSubmitError(data.message || 'Registration could not be completed. Please review details.');
        if (data.message && data.message.toLowerCase().includes('email')) {
          setCurrentStep(1);
          setErrors({ emailAddress: data.message });
        } else if (data.message && data.message.toLowerCase().includes('mobile')) {
          setCurrentStep(1);
          setErrors({ mobileNumber: data.message });
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError('Unable to connect to registration server. Please verify network status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndEnter = () => {
    onClose();
    if (window.location.hash !== '#find-tiffin') {
      window.location.hash = '#find-tiffin';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-md overflow-y-auto flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div 
        className="bg-[#fbf9f5] w-full max-w-[1240px] rounded-2xl shadow-2xl border border-[#ded9d1]/80 overflow-hidden relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating App Bar */}
        <div className="h-16 px-6 sm:px-10 border-b border-[#ded9d1]/60 bg-[#fbf9f5]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              TiffinLink
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a4238]"></span>
            <span className="text-[11px] font-label-caps uppercase tracking-widest text-[#665d52] ml-2 hidden sm:inline">
              Patron Membership Desk
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#665d52] hidden sm:inline">Already a member?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin('login', 'customer');
                }}
                className="font-button-text font-bold text-[#1a1a1a] underline underline-offset-4 decoration-[#ded9d1] hover:decoration-[#1a1a1a] transition-all cursor-pointer"
              >
                Log in
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#efeeea] hover:bg-[#ded9d1] text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Registration Modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Success View (Step 5) */}
        {currentStep === 5 ? (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#1b5e20] text-white flex items-center justify-center mx-auto shadow-lg">
              <span className="material-symbols-outlined text-[40px]">check</span>
            </div>
            <div>
              <p className="font-label-caps text-xs text-[#665d52] uppercase tracking-[0.2em] font-semibold">
                Application Admitted &amp; Verified
              </p>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl text-[#1a1a1a] mt-2 font-medium">
                Welcome to TiffinLink, {createdUser?.name || fullName}!
              </h2>
            </div>
            <p className="font-body-md text-sm sm:text-base text-[#665d52] leading-relaxed">
              Your patron profile and delivery destination have been securely recorded in our culinary network. Your daily meal dashboard is ready.
            </p>
            <div className="p-4 bg-[#efeeea] rounded-xl border border-[#ded9d1] w-full text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#665d52]">Primary Account:</span>
                <strong className="text-[#1a1a1a]">{createdUser?.email || emailAddress}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#665d52]">Delivery Node:</span>
                <span className="text-[#1a1a1a] truncate max-w-[280px]">
                  {buildingFlat}, {streetArea}, {city} - {pinCode}
                </span>
              </div>
            </div>
            <div className="pt-2 w-full">
              <button
                type="button"
                onClick={handleFinishAndEnter}
                className="w-full py-4 bg-[#1a1a1a] hover:bg-[#333] text-white font-button-text text-xs uppercase tracking-widest font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Patron Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">east</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Split-Screen Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* Left Column: Visual Storytelling Panel (5 cols) */}
            <div className="lg:col-span-5 relative bg-[#efeeea] hidden lg:flex flex-col justify-between p-8 xl:p-10 border-r border-[#ded9d1]/70 overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img
                  className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ8gylUX-nW3T8TtGAQOh73C_FkMUzWo-bzTL40rt7Xx840sW0QIjHhvpYfWNaRhhDw1XEwsTf5qmj3F1hDIP408eF6feQHJE_9jRM9u2g1u4rDEhXqh3HcWaGCUbyWg9ZqtpTwFS59BSjwheGbudmZZyKYdXwG008U_HZCwcpvPqhi-OthvI3DecQ7AcKls22CcHFqwWf946LHJUCtjtPK5PkoWzmhWDdqoyQx4u_sIhtQn87bJ5V"
                  alt="Artisanal Tiffin Logistics"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-[#1a1a1a]/40 to-transparent"></div>
              </div>

              {/* Editorial Floating Badges */}
              <div className="relative z-10 flex justify-between items-start">
                <span className="px-3.5 py-1.5 rounded-full bg-[#1a1a1a]/70 backdrop-blur-md text-[11px] font-label-caps tracking-[0.18em] uppercase text-[#fbf9f5] border border-white/20">
                  Editorial Culinary Logistics
                </span>
                <span className="material-symbols-outlined text-white/80 text-xl">all_inclusive</span>
              </div>

              {/* Story Highlights & Proof Badges */}
              <div className="relative z-10 space-y-4 text-white">
                <div className="space-y-2">
                  <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl font-medium leading-tight text-[#fbf9f5]">
                    Homemade goodness, curated for your daily rhythm.
                  </p>
                  <p className="font-body-md text-xs sm:text-sm text-white/80 leading-relaxed">
                    Fresh, warm tiffins direct from certified neighborhood master kitchens. Zero single-use plastics.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/20 grid grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-label-caps uppercase tracking-wider text-white/60">Vessel Standard</span>
                    <span className="text-xs font-semibold text-white mt-0.5">SS304 Insulated</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-label-caps uppercase tracking-wider text-white/60">Hygiene Gate</span>
                    <span className="text-xs font-semibold text-white mt-0.5">FSSAI Audited</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-label-caps uppercase tracking-wider text-white/60">Dispatch Cadence</span>
                    <span className="text-xs font-semibold text-white mt-0.5">12:15 PM · Hot</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a]/60 backdrop-blur-md p-3.5 rounded-xl border border-white/15 flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified</span>
                  <div>
                    <p className="text-[10px] font-label-caps uppercase text-white/70">Canister Custody Protocol</p>
                    <p className="text-xs text-white">Reverse logistics pickup during subsequent meal drop.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Step Interactive Wizard (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
              <div>
                {/* Step Progress Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-[0.16em]">
                        Step {currentStep} of {totalSteps}
                      </span>
                      <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a] mt-0.5 font-semibold">
                        {stepTitles[currentStep]}
                      </h3>
                    </div>
                    <div className="px-3 py-1 bg-[#efeeea] rounded-full text-xs font-button-text font-semibold text-[#1a1a1a]">
                      {progressPercentages[currentStep]} Completed
                    </div>
                  </div>

                  {/* Visual Progress Bar & Connected Dots */}
                  <div className="relative flex items-center justify-between pt-2">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#eae8e4] z-0"></div>
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1a1a1a] transition-all duration-500 ease-out z-0" 
                      style={{ width: trackWidths[currentStep] }}
                    ></div>

                    {[1, 2, 3, 4].map(stepNum => {
                      const isDone = stepNum < currentStep;
                      const isCurrent = stepNum === currentStep;

                      return (
                        <button
                          key={stepNum}
                          type="button"
                          onClick={() => {
                            if (stepNum < currentStep) {
                              setCurrentStep(stepNum);
                            }
                          }}
                          disabled={stepNum > currentStep}
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-button-text text-xs transition-all ring-4 ring-white cursor-pointer ${
                            isDone 
                              ? 'bg-[#4a4238] text-white hover:opacity-90' 
                              : isCurrent 
                                ? 'bg-[#1a1a1a] text-white shadow-md' 
                                : 'bg-[#eae8e4] text-[#665d52] cursor-not-allowed'
                          }`}
                        >
                          {isDone ? (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          ) : (
                            stepNum
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-4 text-center mt-2">
                    <span className={`text-[10px] font-label-caps uppercase tracking-wider ${currentStep === 1 ? 'text-[#1a1a1a] font-bold' : 'text-[#665d52]'}`}>Personal</span>
                    <span className={`text-[10px] font-label-caps uppercase tracking-wider ${currentStep === 2 ? 'text-[#1a1a1a] font-bold' : 'text-[#665d52]'}`}>Security</span>
                    <span className={`text-[10px] font-label-caps uppercase tracking-wider ${currentStep === 3 ? 'text-[#1a1a1a] font-bold' : 'text-[#665d52]'}`}>Address</span>
                    <span className={`text-[10px] font-label-caps uppercase tracking-wider ${currentStep === 4 ? 'text-[#1a1a1a] font-bold' : 'text-[#665d52]'}`}>Review</span>
                  </div>
                </div>

                {/* Server Error Alert Banner */}
                {submitError && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* ================= STEP 1: Personal Details ================= */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-[#665d52] pb-2 border-b border-[#ded9d1]/40">
                      Let's get you acquainted with our certified community kitchens and delivery partners.
                    </p>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rajesh Patel"
                        className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                          errors.fullName ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                        }`}
                      />
                      {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="name@domain.com"
                        className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                          errors.emailAddress ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                        }`}
                      />
                      {errors.emailAddress && <p className="text-red-600 text-xs mt-1">{errors.emailAddress}</p>}
                      <p className="text-[11px] text-[#665d52] mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#4a4238]">info</span>
                        Daily menu drops, thermal logs, and order receipts are dispatched here.
                      </p>
                    </div>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Mobile Number <span className="text-red-600">*</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 py-3 rounded-l-lg bg-[#eae8e4] text-[#1a1a1a] font-button-text text-sm font-semibold border-y border-l border-[#ded9d1]">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="98765 43210"
                          className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-r-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                            errors.mobileNumber ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                          }`}
                        />
                      </div>
                      {errors.mobileNumber && <p className="text-red-600 text-xs mt-1">{errors.mobileNumber}</p>}
                      <p className="text-[11px] text-[#665d52] mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#4a4238]">sms</span>
                        Instant OTP delivery updates &amp; gatekeeper arrival alerts.
                      </p>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: Secure Your Account ================= */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-[#665d52] pb-2 border-b border-[#ded9d1]/40">
                      Set a robust passphrase to safeguard meal escrow orders and subscription credits.
                    </p>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Create Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter strong password"
                          className={`w-full bg-[#f5f3ef] px-4 py-3 pr-11 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                            errors.password ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#665d52] hover:text-[#1a1a1a]"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className={`w-full bg-[#f5f3ef] px-4 py-3 pr-11 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                            errors.confirmPassword ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#665d52] hover:text-[#1a1a1a]"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>

                    {/* Password Requirements Checklist */}
                    <div className="p-4 bg-[#f5f3ef] rounded-xl border border-[#ded9d1]/70 space-y-2">
                      <span className="font-label-caps text-[11px] uppercase tracking-wider text-[#665d52] block font-bold">
                        Security Criteria:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1.5 ${hasMin8 ? 'text-emerald-700 font-semibold' : 'text-[#665d52]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{hasMin8 ? 'check_circle' : 'radio_button_unchecked'}</span>
                          <span>Minimum 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUpperLower ? 'text-emerald-700 font-semibold' : 'text-[#665d52]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{hasUpperLower ? 'check_circle' : 'radio_button_unchecked'}</span>
                          <span>Upper &amp; lowercase letters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-[#665d52]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
                          <span>At least 1 number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-[#665d52]'}`}>
                          <span className="material-symbols-outlined text-[16px]">{hasSpecial ? 'check_circle' : 'radio_button_unchecked'}</span>
                          <span>Special character (!@#$)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: Delivery Address ================= */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-[#665d52] pb-2 border-b border-[#ded9d1]/40">
                      Doorstep insulated drop-off destination for midday and evening meal circuits.
                    </p>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        House / Flat / Tower <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={buildingFlat}
                        onChange={(e) => setBuildingFlat(e.target.value)}
                        placeholder="e.g. Flat 402, Sunrise Towers, Tower B"
                        className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                          errors.buildingFlat ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                        }`}
                      />
                      {errors.buildingFlat && <p className="text-red-600 text-xs mt-1">{errors.buildingFlat}</p>}
                    </div>

                    <div>
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                        Street &amp; Neighborhood <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={streetArea}
                        onChange={(e) => setStreetArea(e.target.value)}
                        placeholder="e.g. Drive-In Road, Bodakdev"
                        className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                          errors.streetArea ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                        }`}
                      />
                      {errors.streetArea && <p className="text-red-600 text-xs mt-1">{errors.streetArea}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border border-[#ded9d1]"
                        />
                      </div>
                      <div>
                        <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                          State
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-[#f5f3ef] px-3 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border border-[#ded9d1]"
                        >
                          <option value="Gujarat">Gujarat</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Delhi">Delhi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-caps text-xs uppercase tracking-wider text-[#665d52] mb-1.5 font-bold">
                          PIN Code <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="380054"
                          className={`w-full bg-[#f5f3ef] px-4 py-3 rounded-lg text-sm text-[#1a1a1a] outline-none border transition-all ${
                            errors.pinCode ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#ded9d1] focus:ring-1 focus:ring-[#1a1a1a]'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.pinCode && <p className="text-red-600 text-xs mt-1">{errors.pinCode}</p>}

                    <div className="flex items-center gap-2 p-3 bg-[#efeeea] rounded-xl text-xs text-[#1a1a1a] border border-[#ded9d1]">
                      <span className="material-symbols-outlined text-[18px] text-[#4a4238]">near_me</span>
                      <span>Active delivery zone: <strong>Satellite / Bodakdev Hub 04</strong> ensures meals arrive under 40 mins from stove flame.</span>
                    </div>
                  </div>
                )}

                {/* ================= STEP 4: Review & Finalize Dossier ================= */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-[#665d52] pb-2 border-b border-[#ded9d1]/40">
                      Review your dossier before activating your dining pass and canister assignment.
                    </p>

                    {/* Summary Card */}
                    <div className="bg-[#f5f3ef] p-5 rounded-xl border border-[#ded9d1] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#ded9d1] pb-2.5">
                        <span className="font-label-caps text-[11px] uppercase tracking-wider text-[#665d52] font-bold">
                          Patron Dossier Summary
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs font-button-text text-[#1a1a1a] underline underline-offset-4 decoration-[#ded9d1] hover:decoration-[#1a1a1a] font-bold cursor-pointer"
                        >
                          Edit Details
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-label-caps uppercase text-[#665d52] block">Full Name</span>
                          <strong className="text-sm text-[#1a1a1a]">{fullName}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-label-caps uppercase text-[#665d52] block">Registered Email</span>
                          <span className="text-sm text-[#1a1a1a]">{emailAddress}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-label-caps uppercase text-[#665d52] block">Mobile Authentication</span>
                          <span className="text-sm text-[#1a1a1a] font-mono">+91 {mobileNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-label-caps uppercase text-[#665d52] block">Delivery Destination</span>
                          <span className="text-sm text-[#1a1a1a]">{buildingFlat}, {streetArea}, {city} - {pinCode}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#ded9d1] flex items-center justify-between text-[11px] text-[#665d52]">
                        <span>Assigned Node: Central Kitchen Escrow 02</span>
                        <span className="text-[#4a4238] font-bold">Eligible for Lunch &amp; Dinner Passes</span>
                      </div>
                    </div>

                    {/* Consents */}
                    <div className="space-y-2.5 pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#665d52]">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#1a1a1a] rounded cursor-pointer"
                        />
                        <span>
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={() => onOpenLegalModal && onOpenLegalModal('terms')}
                            className="text-[#1a1a1a] font-semibold underline underline-offset-2"
                          >
                            Terms &amp; Conditions
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => onOpenLegalModal && onOpenLegalModal('privacy-policy')}
                            className="text-[#1a1a1a] font-semibold underline underline-offset-2"
                          >
                            Privacy Policy
                          </button>
                          , and consent to SS304 multi-tier canister circulation loop.
                        </span>
                      </label>
                      {errors.agreeTerms && <p className="text-red-600 text-xs">{errors.agreeTerms}</p>}

                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#665d52]">
                        <input
                          type="checkbox"
                          checked={thermalAlerts}
                          onChange={(e) => setThermalAlerts(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-[#1a1a1a] rounded cursor-pointer"
                        />
                        <span>
                          Send real-time chef dispatch temperature logs and daily culinary notes via WhatsApp/SMS.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Nav */}
              <div className="pt-8 border-t border-[#ded9d1]/60 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-[#efeeea] hover:bg-[#ded9d1] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Back</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3.5 bg-[#1a1a1a] hover:bg-[#333] text-white font-button-text text-xs uppercase tracking-wider font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <span>Continue to {currentStep === 1 ? 'Security' : currentStep === 2 ? 'Address' : 'Review'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitRegistration}
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-8 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#888] text-white font-button-text text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        <span>Recording Patron Dossier in MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <span>CREATE PATRON ACCOUNT</span>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
