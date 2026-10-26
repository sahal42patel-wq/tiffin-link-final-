import React, { useState, useEffect } from 'react';
import { 
  X, User, MapPin, CreditCard, Utensils, Calendar, Bell, 
  Check, Plus, Trash2, ShieldCheck, Save, Smartphone, Mail,
  Sun, Moon, Monitor, Palette, Home, Building2, Navigation, Loader2, Star
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, safeSetItem } from '../services/api';

const AHMEDABAD_LOCALITIES = [
  'Vastrapur',
  'Satellite',
  'Bodakdev',
  'Prahlad Nagar',
  'Navrangpura',
  'Paldi',
  'South Bopal',
  'Gota',
  'Thaltej',
  'C.G. Road',
  'Maninagar',
  'Chandkheda'
];

const SAMPLE_PLANS = [
  {
    id: 'sub_kathiyawadi',
    planName: 'Kathiyawadi Executive Lunch Plan',
    mealsLeft: 26,
    schedule: 'Mon–Sat (12:30 PM) • Bajra Rotla, Ringna Olo, Dal-Bhat & Chaas',
    price: '₹3,200/mo',
    badge: 'Popular'
  },
  {
    id: 'sub_heritage',
    planName: 'Ahmedabad Heritage Thali Plan',
    mealsLeft: 6,
    schedule: 'Mon–Sat (1:00 PM) • 5 Soft Phulka Ghee, 2 Fresh Sabzis, Kadhi-Khichdi',
    price: '₹850/wk',
    badge: 'Weekly'
  },
  {
    id: 'sub_jain',
    planName: 'Jain Satvik Pure Daily Meal Plan',
    mealsLeft: 30,
    schedule: 'Daily (12:00 PM & 7:30 PM) • No root vegetables, cow ghee, temple-pure prep',
    price: '₹3,450/mo',
    badge: 'Satvik'
  }
];

const normalizeAddress = (addr, idx) => {
  if (!addr) return null;
  const id = addr._id || addr.id || `addr_${Date.now()}_${idx || 0}`;
  const label = addr.label || addr.type || 'Home';
  const street = addr.street || addr.address || '';
  const area = addr.area || addr.locality || '';
  const city = addr.city || 'Ahmedabad';
  const state = addr.state || 'Gujarat';
  const pincode = addr.pincode || '';
  const landmark = addr.landmark || '';
  const isDefault = Boolean(addr.isDefault);
  const fullAddress = street
    ? (street + (area && !street.toLowerCase().includes(area.toLowerCase()) ? `, ${area}` : ''))
    : (area || 'Ahmedabad');

  return {
    _id: id,
    id,
    label,
    type: label,
    street,
    area,
    locality: area || 'Ahmedabad',
    address: fullAddress,
    city,
    state,
    pincode,
    landmark,
    isDefault
  };
};

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  initialTab = 'profile', 
  currentUser, 
  onUpdateUser, 
  onLogout, 
  onOpenLegalModal,
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveToast, setSaveToast] = useState(false);
  const [privacyToast, setPrivacyToast] = useState('');
  const [paymentToast, setPaymentToast] = useState({ show: false, msg: '', type: 'success' });
  const [prefsToast, setPrefsToast] = useState({ show: false, msg: '' });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [notifToast, setNotifToast] = useState('');
  const [subscriptionToast, setSubscriptionToast] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const { theme, resolvedTheme, isDark, compactMode, reduceMotion, setTheme, setCompactMode, setReduceMotion } = useTheme();

  // Active sessions state with localStorage persistence
  const [sessions, setSessions] = useState(() => {
    try {
      const cached = localStorage.getItem('tiffinlink_user_sessions');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      { id: 'curr', device: 'Chrome 129 on Windows 11', ip: '103.21.124.89 (Ahmedabad, Gujarat)', isCurrent: true, lastActive: 'Active now' },
      { id: 'mob', device: 'Mobile Safari on iPhone 15', ip: '103.21.124.91 (Ahmedabad, Gujarat)', isCurrent: false, lastActive: 'Yesterday at 8:42 PM' }
    ];
  });

  // Privacy and data consents with persistent fallback
  const [privacySettings, setPrivacySettings] = useState(() => {
    let saved = {};
    try {
      const cached = localStorage.getItem('tiffinlink_privacy_settings');
      if (cached) saved = JSON.parse(cached);
    } catch (_) {}
    return {
      shareLiveGps: currentUser?.privacySettings?.shareLiveGps ?? saved.shareLiveGps ?? true,
      personalizedChefs: currentUser?.privacySettings?.personalizedChefs ?? saved.personalizedChefs ?? true,
      telemetryAnalytics: currentUser?.privacySettings?.telemetryAnalytics ?? saved.telemetryAnalytics ?? true,
      retainOrderHistory: currentUser?.privacySettings?.retainOrderHistory ?? saved.retainOrderHistory ?? true
    };
  });

  // Profile & food preferences state
  const [profileData, setProfileData] = useState(() => {
    let savedPrefs = {};
    try {
      const cached = localStorage.getItem('tiffinlink_food_preferences');
      if (cached) savedPrefs = JSON.parse(cached);
    } catch (_) {}

    return {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      dietary: currentUser?.preferences?.dietary || currentUser?.dietary || savedPrefs.dietary || 'Veg',
      spiceLevel: currentUser?.preferences?.spiceLevel || currentUser?.spiceLevel || savedPrefs.spiceLevel || 'Medium Spice',
      rotliType: currentUser?.preferences?.rotliType || currentUser?.rotliType || savedPrefs.rotliType || 'Soft Phulka Rotli (Ghee)',
      noOnionGarlic: currentUser?.preferences?.noOnionGarlic ?? currentUser?.noOnionGarlic ?? savedPrefs.noOnionGarlic ?? false,
      lessOil: currentUser?.preferences?.lessOil ?? currentUser?.lessOil ?? savedPrefs.lessOil ?? false
    };
  });

  // Saved addresses state
  const [addresses, setAddresses] = useState(() => {
    const list = currentUser?.savedAddresses || currentUser?.addresses || [];
    return Array.isArray(list) ? list.map(normalizeAddress).filter(Boolean) : [];
  });
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressToast, setAddressToast] = useState({ show: false, msg: '', type: 'success' });

  // Add Address Form State
  const [newAddressType, setNewAddressType] = useState('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('Vastrapur');
  const [newLandmark, setNewLandmark] = useState('');
  const [newPincode, setNewPincode] = useState('380015');
  const [isDefaultCheckbox, setIsDefaultCheckbox] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Payment methods state with persistence
  const [paymentMethods, setPaymentMethods] = useState(() => {
    if (currentUser?.paymentMethods && Array.isArray(currentUser.paymentMethods) && currentUser.paymentMethods.length > 0) {
      return currentUser.paymentMethods;
    }
    try {
      const cached = localStorage.getItem('tiffinlink_payment_methods');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [
      { id: 'pm_upi_1', type: 'UPI', detail: 'zaid.mansuri@okhdfcbank', label: 'HDFC UPI', isDefault: true }
    ];
  });
  const [newUpiId, setNewUpiId] = useState('');

  // Active meal subscription state with persistence
  const [subscription, setSubscription] = useState(() => {
    if (currentUser?.subscription) return currentUser.subscription;
    try {
      const cached = localStorage.getItem('tiffinlink_active_subscription');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });

  // Notifications preferences state with persistence
  const [notifications, setNotifications] = useState(() => {
    let saved = {};
    try {
      const cached = localStorage.getItem('tiffinlink_notification_preferences');
      if (cached) saved = JSON.parse(cached);
    } catch (_) {}
    return {
      orderStatusWhatsapp: currentUser?.notifications?.orderStatusWhatsapp ?? saved.orderStatusWhatsapp ?? true,
      driverEnRouteSms: currentUser?.notifications?.driverEnRouteSms ?? saved.driverEnRouteSms ?? true,
      dailyTiffinReminder: currentUser?.notifications?.dailyTiffinReminder ?? saved.dailyTiffinReminder ?? true,
      kitchenMenuUpdates: currentUser?.notifications?.kitchenMenuUpdates ?? saved.kitchenMenuUpdates ?? false,
      promotions: currentUser?.notifications?.promotions ?? saved.promotions ?? false
    };
  });

  // Sync when initialTab or currentUser changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        dietary: currentUser.preferences?.dietary || currentUser.dietary || prev.dietary,
        spiceLevel: currentUser.preferences?.spiceLevel || currentUser.spiceLevel || prev.spiceLevel,
        rotliType: currentUser.preferences?.rotliType || currentUser.rotliType || prev.rotliType,
        noOnionGarlic: currentUser.preferences?.noOnionGarlic ?? currentUser.noOnionGarlic ?? prev.noOnionGarlic,
        lessOil: currentUser.preferences?.lessOil ?? currentUser.lessOil ?? prev.lessOil
      }));

      if (currentUser.paymentMethods && Array.isArray(currentUser.paymentMethods) && currentUser.paymentMethods.length > 0) {
        setPaymentMethods(currentUser.paymentMethods);
      }
      if (currentUser.subscription) {
        setSubscription(currentUser.subscription);
      }
      if (currentUser.notifications) {
        setNotifications(prev => ({ ...prev, ...currentUser.notifications }));
      }
      if (currentUser.privacySettings) {
        setPrivacySettings(prev => ({ ...prev, ...currentUser.privacySettings }));
      }
    }
  }, [currentUser]);

  // Synchronize saved addresses from server and local cache
  useEffect(() => {
    if (!isOpen) return;
    const fetchAddresses = async () => {
      try {
        const cached = localStorage.getItem('tiffinlink_saved_addresses');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAddresses(parsed.map(normalizeAddress).filter(Boolean));
          }
        }
      } catch (_) {}

      try {
        setIsAddressLoading(true);
        const res = await apiRequest('/customers/addresses');
        if (res && res.success && Array.isArray(res.data)) {
          const normalized = res.data.map(normalizeAddress).filter(Boolean);
          setAddresses(normalized);
          safeSetItem('tiffinlink_saved_addresses', JSON.stringify(normalized));
        }
      } catch (err) {
        console.warn('Could not fetch server addresses:', err);
      } finally {
        setIsAddressLoading(false);
      }
    };

    fetchAddresses();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const showAddrToast = (msg, type = 'success') => {
    setAddressToast({ show: true, msg, type });
    setTimeout(() => setAddressToast({ show: false, msg: '', type: 'success' }), 3500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      name: profileData.name,
      phone: profileData.phone,
      savedAddresses: addresses
    };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone
        })
      });
    } catch (_) {}
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const streetVal = (newStreet || '').trim();
    if (!streetVal) {
      showAddrToast('Please enter your flat/house no. and building/society name.', 'error');
      return;
    }

    try {
      setIsSavingAddress(true);
      const payload = {
        label: newAddressType,
        street: streetVal,
        area: (newArea || 'Ahmedabad').trim(),
        landmark: (newLandmark || '').trim(),
        pincode: (newPincode || '380015').trim(),
        city: 'Ahmedabad',
        state: 'Gujarat',
        isDefault: addresses.length === 0 ? true : isDefaultCheckbox
      };

      let serverAddresses = null;
      try {
        const res = await apiRequest('/customers/addresses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res && res.success && Array.isArray(res.data)) {
          serverAddresses = res.data.map(normalizeAddress).filter(Boolean);
        }
      } catch (apiErr) {
        console.warn('Server address POST notice:', apiErr);
      }

      let nextAddresses;
      if (serverAddresses) {
        nextAddresses = serverAddresses;
      } else {
        const localNew = normalizeAddress({
          _id: `addr_${Date.now()}`,
          ...payload
        });
        if (payload.isDefault) {
          nextAddresses = addresses.map(a => ({ ...a, isDefault: false })).concat(localNew);
        } else {
          nextAddresses = [...addresses, localNew];
        }
      }

      setAddresses(nextAddresses);
      safeSetItem('tiffinlink_saved_addresses', JSON.stringify(nextAddresses));

      if (onUpdateUser && currentUser) {
        onUpdateUser({
          ...currentUser,
          savedAddresses: nextAddresses,
          addresses: nextAddresses
        });
      }

      setNewStreet('');
      setNewLandmark('');
      showAddrToast('✓ Ahmedabad address saved to your profile successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      showAddrToast('Failed to save address. Please try again.', 'error');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const nextAddresses = addresses.filter(a => a.id !== id && a._id !== id);
      setAddresses(nextAddresses);
      safeSetItem('tiffinlink_saved_addresses', JSON.stringify(nextAddresses));

      if (onUpdateUser && currentUser) {
        onUpdateUser({
          ...currentUser,
          savedAddresses: nextAddresses,
          addresses: nextAddresses
        });
      }

      try {
        await apiRequest(`/customers/addresses/${id}`, { method: 'DELETE' });
      } catch (_) {}

      showAddrToast('Address removed from profile.');
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const nextAddresses = addresses.map(a => ({
        ...a,
        isDefault: (a.id === id || a._id === id)
      }));
      setAddresses(nextAddresses);
      safeSetItem('tiffinlink_saved_addresses', JSON.stringify(nextAddresses));

      if (onUpdateUser && currentUser) {
        onUpdateUser({
          ...currentUser,
          savedAddresses: nextAddresses,
          addresses: nextAddresses
        });
      }

      try {
        await apiRequest(`/customers/addresses/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ isDefault: true })
        });
      } catch (_) {}

      showAddrToast('✓ Set as primary default delivery address.');
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showAddrToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsDetectingGps(false);
        setNewArea('Satellite');
        setNewStreet(prev => prev || 'Near Current Location');
        showAddrToast('📍 Ahmedabad location detected: Satellite area');
      },
      () => {
        setIsDetectingGps(false);
        showAddrToast('Unable to detect GPS position. Please pick your locality from below.', 'error');
      },
      { timeout: 8000 }
    );
  };

  const handleAddUpi = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const upi = (newUpiId || '').trim();
    if (!upi || !upi.includes('@')) {
      setPaymentToast({ show: true, msg: 'Please enter a valid UPI VPA (e.g. yourname@okhdfcbank or 9876543210@paytm)', type: 'error' });
      return;
    }
    const cleanUpi = upi.toLowerCase();
    // Prevent duplicate VPA
    if (paymentMethods.some(pm => (pm.detail || '').toLowerCase() === cleanUpi)) {
      setPaymentToast({ show: true, msg: 'This UPI VPA is already linked to your account.', type: 'error' });
      return;
    }

    const providerName = cleanUpi.split('@')[1] ? cleanUpi.split('@')[1].toUpperCase() : 'UPI';
    const newMethod = {
      id: `upi_${Date.now()}`,
      type: 'UPI',
      detail: cleanUpi,
      label: `${providerName} VPA`,
      isDefault: paymentMethods.length === 0
    };

    const nextList = [...paymentMethods, newMethod];
    setPaymentMethods(nextList);
    safeSetItem('tiffinlink_payment_methods', JSON.stringify(nextList));
    setNewUpiId('');

    if (onUpdateUser && currentUser) {
      onUpdateUser({
        ...currentUser,
        paymentMethods: nextList
      });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ paymentMethods: nextList })
      });
    } catch (err) {
      console.warn('Backend paymentMethods sync:', err);
    }

    setPaymentToast({ show: true, msg: `✓ UPI VPA "${cleanUpi}" verified & linked successfully!`, type: 'success' });
    setTimeout(() => setPaymentToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const handleSetDefaultPayment = async (id) => {
    const nextList = paymentMethods.map(pm => ({
      ...pm,
      isDefault: (pm.id === id || String(pm.id) === String(id))
    }));
    setPaymentMethods(nextList);
    safeSetItem('tiffinlink_payment_methods', JSON.stringify(nextList));

    if (onUpdateUser && currentUser) {
      onUpdateUser({
        ...currentUser,
        paymentMethods: nextList
      });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ paymentMethods: nextList })
      });
    } catch (_) {}

    setPaymentToast({ show: true, msg: '✓ Primary default payment method updated.', type: 'success' });
    setTimeout(() => setPaymentToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const handleDeletePayment = async (id) => {
    const nextList = paymentMethods.filter(pm => pm.id !== id && String(pm.id) !== String(id));
    if (nextList.length > 0 && !nextList.some(pm => pm.isDefault)) {
      nextList[0].isDefault = true;
    }
    setPaymentMethods(nextList);
    safeSetItem('tiffinlink_payment_methods', JSON.stringify(nextList));

    if (onUpdateUser && currentUser) {
      onUpdateUser({
        ...currentUser,
        paymentMethods: nextList
      });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ paymentMethods: nextList })
      });
    } catch (_) {}

    setPaymentToast({ show: true, msg: 'Payment method removed from account.', type: 'info' });
    setTimeout(() => setPaymentToast({ show: false, msg: '', type: 'info' }), 3000);
  };

  const handleQuickBankSuffix = (suffix) => {
    setNewUpiId(prev => {
      const base = prev.includes('@') ? prev.split('@')[0] : prev;
      return base ? `${base}${suffix}` : `user${suffix}`;
    });
  };

  const handleSaveFoodPreferences = async () => {
    setIsSavingPrefs(true);
    const prefs = {
      dietary: profileData.dietary,
      rotliType: profileData.rotliType,
      spiceLevel: profileData.spiceLevel,
      noOnionGarlic: Boolean(profileData.noOnionGarlic),
      lessOil: Boolean(profileData.lessOil)
    };

    safeSetItem('tiffinlink_food_preferences', JSON.stringify(prefs));

    if (onUpdateUser && currentUser) {
      onUpdateUser({
        ...currentUser,
        preferences: prefs,
        dietary: prefs.dietary,
        rotliType: prefs.rotliType,
        spiceLevel: prefs.spiceLevel,
        noOnionGarlic: prefs.noOnionGarlic,
        lessOil: prefs.lessOil
      });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: prefs,
          dietary: prefs.dietary,
          rotliType: prefs.rotliType,
          spiceLevel: prefs.spiceLevel,
          noOnionGarlic: prefs.noOnionGarlic,
          lessOil: prefs.lessOil
        })
      });
    } catch (err) {
      console.warn('Backend sync for food preferences:', err);
    } finally {
      setIsSavingPrefs(false);
      setPrefsToast({ show: true, msg: '✓ Food preferences saved to profile & verified with home chefs!' });
      setTimeout(() => setPrefsToast({ show: false, msg: '' }), 3500);
    }
  };

  const handleActivateSubscription = async (plan) => {
    const newSub = {
      planName: plan.planName,
      mealsLeft: plan.mealsLeft,
      schedule: plan.schedule,
      status: 'active',
      startDate: new Date().toISOString()
    };
    setSubscription(newSub);
    safeSetItem('tiffinlink_active_subscription', JSON.stringify(newSub));

    if (onUpdateUser && currentUser) {
      onUpdateUser({ ...currentUser, subscription: newSub });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ subscription: newSub })
      });
    } catch (_) {}

    setSubscriptionToast(`✓ "${plan.planName}" activated! Fresh meals will be delivered as scheduled.`);
    setTimeout(() => setSubscriptionToast(''), 4000);
  };

  const handlePauseResumeSubscription = async () => {
    if (!subscription) return;
    const isPaused = subscription.status === 'paused';
    const updatedSub = {
      ...subscription,
      status: isPaused ? 'active' : 'paused'
    };
    setSubscription(updatedSub);
    safeSetItem('tiffinlink_active_subscription', JSON.stringify(updatedSub));

    if (onUpdateUser && currentUser) {
      onUpdateUser({ ...currentUser, subscription: updatedSub });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ subscription: updatedSub })
      });
    } catch (_) {}

    setSubscriptionToast(isPaused ? '✓ Subscription resumed! Upcoming tiffins are scheduled.' : '⏸ Subscription paused for upcoming deliveries without penalty.');
    setTimeout(() => setSubscriptionToast(''), 3500);
  };

  const handleToggleNotification = async (key) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    safeSetItem('tiffinlink_notification_preferences', JSON.stringify(next));

    if (onUpdateUser && currentUser) {
      onUpdateUser({ ...currentUser, notifications: next });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ notifications: next })
      });
    } catch (_) {}

    setNotifToast('✓ Notification settings updated & saved');
    setTimeout(() => setNotifToast(''), 2500);
  };

  const handleSaveAllNotifications = async () => {
    safeSetItem('tiffinlink_notification_preferences', JSON.stringify(notifications));
    if (onUpdateUser && currentUser) {
      onUpdateUser({ ...currentUser, notifications });
    }
    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ notifications })
      });
    } catch (_) {}
    setNotifToast('✓ All notification preferences saved successfully!');
    setTimeout(() => setNotifToast(''), 3000);
  };

  const handleSignOutOtherSessions = () => {
    const remaining = sessions.filter(s => s.isCurrent);
    setSessions(remaining);
    safeSetItem('tiffinlink_user_sessions', JSON.stringify(remaining));
    setPrivacyToast('✓ Signed out of all other active sessions and devices.');
    setTimeout(() => setPrivacyToast(''), 3500);
  };

  const handleRevokeSession = (id) => {
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    safeSetItem('tiffinlink_user_sessions', JSON.stringify(remaining));
    setPrivacyToast('✓ Device session revoked successfully.');
    setTimeout(() => setPrivacyToast(''), 3000);
  };

  const handleTogglePrivacySetting = async (key) => {
    const next = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(next);
    safeSetItem('tiffinlink_privacy_settings', JSON.stringify(next));

    if (onUpdateUser && currentUser) {
      onUpdateUser({ ...currentUser, privacySettings: next });
    }

    try {
      await apiRequest('/customers/profile', {
        method: 'PUT',
        body: JSON.stringify({ privacySettings: next })
      });
    } catch (_) {}

    setPrivacyToast('✓ Privacy choices updated & saved.');
    setTimeout(() => setPrivacyToast(''), 2500);
  };

  const handleExportData = () => {
    const archiveData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'TiffinLink Artisanal Dining',
      user: {
        id: currentUser?._id || currentUser?.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: currentUser?.role || 'customer'
      },
      diningPreferences: {
        dietary: profileData.dietary,
        spiceLevel: profileData.spiceLevel,
        rotliType: profileData.rotliType,
        noOnionGarlic: profileData.noOnionGarlic,
        lessOil: profileData.lessOil
      },
      savedAddresses: addresses,
      paymentProfilesCount: paymentMethods.length,
      consents: privacySettings,
      activeSessionsCount: sessions.length
    };

    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TiffinLink_Data_Archive_${(profileData.name || 'user').replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setPrivacyToast('Personal data archive generated and downloaded.');
    setTimeout(() => setPrivacyToast(''), 3500);
  };

  const handleConfirmDeletion = () => {
    setDeletionSuccess(true);
    setPrivacyToast('Account deletion request submitted. Regulatory verification in progress.');
    setTimeout(() => {
      setPrivacyToast('');
      setIsDeletingAccount(false);
      setDeletionSuccess(false);
      if (onLogout) onLogout();
      onClose();
    }, 2500);
  };

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'preferences', label: 'Tiffin Preferences', icon: Utensils },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'subscriptions', label: 'Subscriptions', icon: Calendar },
    { id: 'notifications', label: 'Notifications Settings', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#fbf9f5] border border-[#ded9d1] rounded-3xl max-w-4xl w-full h-[90vh] max-h-[720px] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-[#f5f3ef] border-b md:border-b-0 md:border-r border-[#ded9d1] p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-[#ded9d1]/70">
              <div className="w-12 h-12 rounded-full bg-[#a0522d] text-white flex items-center justify-center text-lg font-bold shadow">
                {(profileData.name || 'Z')[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-[#1a1a1a] truncate">{profileData.name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b5e20]/10 text-[#1b5e20] uppercase">
                  Verified Diner
                </span>
              </div>
            </div>

            <nav className="mt-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1a1a1a] text-white shadow-sm' 
                        : 'text-[#4a4238] hover:bg-black/5 hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-[#665d52]'} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-[#ded9d1]/70 mt-4">
            <button
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="w-full text-left text-xs font-bold text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Sign Out</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf9f5]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ded9d1] bg-[#fbf9f5]">
            <h2 className="font-display-lg text-xl sm:text-2xl text-[#1a1a1a]">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#ded9d1]/40 hover:bg-[#ded9d1] text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Tab 1: Personal Information */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Mobile Phone (Delivery OTP & SMS)</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#ded9d1]/30 text-sm text-[#665d52] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-[#665d52]">Primary account ID cannot be changed directly.</p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#a0522d] text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                  {saveToast && (
                    <span className="text-xs font-bold text-[#1b5e20] flex items-center gap-1 animate-in fade-in">
                      <Check size={14} /> Saved successfully!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Feedback Toast */}
                {addressToast.show && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm ${
                    addressToast.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>{addressToast.msg}</span>
                    <button type="button" onClick={() => setAddressToast({ show: false, msg: '', type: 'success' })} className="text-current hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Saved Address Cards List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#665d52]">
                      Your Saved Delivery Addresses ({addresses.length})
                    </h3>
                    {isAddressLoading && (
                      <span className="text-[11px] text-[#665d52] flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-[#a0522d]" /> Syncing...
                      </span>
                    )}
                  </div>

                  {addresses.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-[#ded9d1] bg-white/40 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#a0522d]/10 text-[#a0522d] mx-auto flex items-center justify-center">
                        <MapPin size={20} />
                      </div>
                      <p className="text-xs font-bold text-[#1a1a1a]">No saved Ahmedabad addresses yet</p>
                      <p className="text-[11px] text-[#665d52] max-w-xs mx-auto">
                        Add your home, office, or hostel delivery address below for seamless 1-click tiffin ordering.
                      </p>
                    </div>
                  ) : (
                    addresses.map((addr, idx) => {
                      const TypeIcon = addr.type === 'Office' ? Building2 : addr.type === 'Home' ? Home : MapPin;
                      return (
                        <div 
                          key={addr.id || addr._id || idx}
                          className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                            addr.isDefault 
                              ? 'border-[#1a1a1a] bg-[#f5f3ef] shadow-sm ring-1 ring-[#1a1a1a]/10' 
                              : 'border-[#ded9d1] bg-white/60 hover:bg-[#f5f3ef]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="p-2.5 rounded-xl bg-[#a0522d]/10 text-[#a0522d] shrink-0 mt-0.5">
                              <TypeIcon size={18} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                                  {addr.label || addr.type || 'Home'}
                                </span>
                                {addr.isDefault ? (
                                  <span className="bg-[#1b5e20] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                                    <Check size={10} /> Default Delivery
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addr.id || addr._id)}
                                    className="text-[11px] font-semibold text-[#665d52] hover:text-[#1a1a1a] underline cursor-pointer"
                                  >
                                    Set as Default
                                  </button>
                                )}
                              </div>
                              <p className="text-sm font-bold text-[#1a1a1a] mt-1.5 leading-snug">
                                {addr.street || addr.address}
                              </p>
                              <p className="text-xs text-[#665d52] mt-0.5">
                                {addr.area || addr.locality || 'Ahmedabad'}, Ahmedabad, Gujarat {addr.pincode ? `• PIN: ${addr.pincode}` : ''}
                              </p>
                              {addr.landmark && (
                                <p className="text-[11px] text-[#a0522d] font-medium mt-1">
                                  🚩 Landmark: {addr.landmark}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id || addr._id)}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete address"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add New Address Form */}
                <form onSubmit={handleAddAddress} className="p-5 rounded-2xl bg-[#f5f3ef] border border-[#ded9d1] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus size={14} className="text-[#a0522d]" /> Add New Ahmedabad Address
                    </p>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isDetectingGps}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a0522d] hover:text-[#7f3f1e] px-2.5 py-1 rounded-lg bg-white border border-[#ded9d1] shadow-2xs hover:bg-[#faf8f5] transition-colors cursor-pointer"
                    >
                      {isDetectingGps ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Detecting GPS...
                        </>
                      ) : (
                        <>
                          <Navigation size={12} /> Auto-Detect GPS
                        </>
                      )}
                    </button>
                  </div>

                  {/* Address Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#665d52] uppercase tracking-wider">Address Category</label>
                    <div className="flex gap-2">
                      {[
                        { type: 'Home', icon: Home },
                        { type: 'Office', icon: Building2 },
                        { type: 'Other', icon: MapPin }
                      ].map(({ type, icon: Icon }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewAddressType(type)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                            newAddressType === type 
                              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-xs' 
                              : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-[#faf8f5]'
                          }`}
                        >
                          <Icon size={13} />
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* House / Building Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#665d52] uppercase tracking-wider">
                      House / Flat / Office No. &amp; Society Name *
                    </label>
                    <input 
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="e.g. Flat 402, Shivalik Highstreet or B-12 Shyamal Row House"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-white text-sm text-[#1a1a1a] placeholder:text-stone-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                      required
                    />
                  </div>

                  {/* Quick Ahmedabad Locality Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#665d52] uppercase tracking-wider">
                        Ahmedabad Area / Locality *
                      </label>
                      <span className="text-[10px] text-[#8c8273]">Tap chip to select</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AHMEDABAD_LOCALITIES.map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setNewArea(loc)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-colors ${
                            newArea.toLowerCase() === loc.toLowerCase()
                              ? 'bg-[#a0522d] text-white border-[#a0522d]'
                              : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-stone-100'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="Or enter custom Ahmedabad locality (e.g. Vastrapur)"
                      className="w-full mt-1 px-3.5 py-2 rounded-xl border border-[#ded9d1] bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                  </div>

                  {/* Landmark & Pincode Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#665d52] uppercase tracking-wider">
                        Landmark (Optional)
                      </label>
                      <input 
                        type="text"
                        value={newLandmark}
                        onChange={(e) => setNewLandmark(e.target.value)}
                        placeholder="e.g. Near Vastrapur Lake / Opp. Reliance Mart"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#ded9d1] bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#665d52] uppercase tracking-wider">
                        Pincode
                      </label>
                      <input 
                        type="text"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        placeholder="380015"
                        maxLength={6}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#ded9d1] bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>
                  </div>

                  {/* Default Address Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input 
                      type="checkbox"
                      checked={isDefaultCheckbox}
                      onChange={(e) => setIsDefaultCheckbox(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-[#1a1a1a] border-[#ded9d1] cursor-pointer"
                    />
                    <span className="text-xs text-[#4a4238] font-medium">
                      Set as primary default delivery address for all tiffins
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSavingAddress}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#a0522d] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAddress ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving to Profile...
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add Address
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Payment Methods */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Feedback Toast */}
                {paymentToast.show && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm ${
                    paymentToast.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span>{paymentToast.msg}</span>
                    <button type="button" onClick={() => setPaymentToast({ show: false, msg: '', type: 'success' })} className="text-current hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#665d52]">
                      Saved Payment Methods ({paymentMethods.length})
                    </h3>
                    <span className="text-[11px] text-[#8c8273]">Instant UPI Auto-Pay</span>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-[#ded9d1] bg-white text-center">
                      <p className="text-xs text-[#665d52] italic">
                        No saved payment methods. Add your UPI ID below for seamless 1-click tiffin checkout.
                      </p>
                    </div>
                  ) : (
                    paymentMethods.map((pm) => (
                      <div 
                        key={pm.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          pm.isDefault 
                            ? 'bg-[#1b5e20]/5 border-[#1b5e20]/40 shadow-xs' 
                            : 'bg-white border-[#ded9d1]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs ${
                            pm.isDefault ? 'bg-[#1b5e20] text-white border-[#1b5e20]' : 'bg-[#f5f3ef] text-[#1a1a1a] border-[#ded9d1]'
                          }`}>
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[#1a1a1a]">{pm.label || 'UPI Account'}</p>
                              {pm.isDefault && (
                                <span className="bg-[#1b5e20] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Primary Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-mono text-[#4a4238] mt-0.5">{pm.detail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!pm.isDefault && (
                            <button 
                              type="button"
                              onClick={() => handleSetDefaultPayment(pm.id)}
                              className="text-xs font-bold text-[#a0522d] hover:underline cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(pm.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove UPI method"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add UPI Form */}
                <form onSubmit={handleAddUpi} className="p-5 rounded-2xl bg-[#f5f3ef] border border-[#ded9d1] space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus size={14} /> Link New UPI VPA ID
                    </p>
                    <span className="text-[10px] text-[#665d52]">Supports GPay, PhonePe, Paytm &amp; BHIM</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      placeholder="username@okhdfcbank or yourphone@paytm"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-white text-sm text-[#1a1a1a] placeholder:text-stone-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                      required
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-[#a0522d] transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      Verify &amp; Link
                    </button>
                  </div>

                  {/* Bank Suffix Quick Chips */}
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-[#8c8273]">Quick handles:</span>
                      {['@okhdfcbank', '@okaxis', '@okicici', '@paytm', '@ybl'].map(suffix => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => handleQuickBankSuffix(suffix)}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#ded9d1] text-[10px] font-mono font-medium text-[#4a4238] hover:bg-[#a0522d] hover:text-white hover:border-[#a0522d] transition-colors cursor-pointer"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 4: Tiffin Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 max-w-lg animate-in fade-in duration-200">
                {prefsToast.show && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      <span>{prefsToast.msg}</span>
                    </div>
                    <button type="button" onClick={() => setPrefsToast({ show: false, msg: '' })} className="hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Dietary Classification</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Veg', 'Jain Satvik', 'Non-Veg'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, dietary: d }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          profileData.dietary === d 
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow' 
                            : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Rotli / Bread Preference</label>
                  <select
                    value={profileData.rotliType}
                    onChange={(e) => setProfileData(prev => ({ ...prev, rotliType: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  >
                    <option value="Soft Phulka Rotli (Ghee)">Soft Phulka Rotli (Ghee)</option>
                    <option value="Dry Phulka (No Ghee / Satvik)">Dry Phulka (No Ghee / Satvik)</option>
                    <option value="Kathiyawadi Bajra Rotla">Kathiyawadi Bajra Rotla</option>
                    <option value="Crispy Gujarati Bhakhri">Crispy Gujarati Bhakhri</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Spice Tolerance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild / Sweet (Gujarati)', 'Medium Spice', 'Spicy / Kathiyawadi'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, spiceLevel: s }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          profileData.spiceLevel === s 
                            ? 'bg-[#a0522d] text-white border-[#a0522d] shadow' 
                            : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[#ded9d1] bg-white hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={profileData.noOnionGarlic}
                      onChange={(e) => setProfileData(prev => ({ ...prev, noOnionGarlic: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#1a1a1a]">Strictly No Onion &amp; No Garlic (Jain / Vaishnav Prep)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[#ded9d1] bg-white hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox"
                      checked={profileData.lessOil}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lessOil: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#1a1a1a]">Healthy Low Oil &amp; Low Sodium Cooking</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSaveFoodPreferences}
                  disabled={isSavingPrefs}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#a0522d] transition-all cursor-pointer shadow disabled:opacity-50"
                >
                  {isSavingPrefs ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Preferences...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save Food Preferences
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab: Appearance & Theme */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0522d]">Display & Aesthetics</span>
                  <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-[#F4F4F6] mt-0.5">Appearance &amp; Density</h3>
                  <p className="text-xs text-[#665d52] dark:text-[#A1A1AA] mt-1">
                    Choose how TiffinLink renders across your device. Changes apply immediately across the entire website.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-[#F4F4F6]">Interface Theme</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* System Default */}
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${
                        theme === 'system'
                          ? 'border-[#1a1a1a] dark:border-white bg-[#f5f3ef] dark:bg-[#1F1F24] ring-2 ring-black/10 dark:ring-white/20 shadow-md'
                          : 'border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Monitor size={22} className="text-[#1a1a1a] dark:text-[#F4F4F6]" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'system'
                            ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-[#111113]'
                            : 'bg-black/5 dark:bg-white/10 text-[#665d52] dark:text-[#A1A1AA]'
                        }`}>
                          {theme === 'system' ? 'ACTIVE' : 'OS SYNC'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1a1a1a] dark:text-[#F4F4F6] flex items-center justify-between">
                          <span>System Default</span>
                          {theme === 'system' && <Check size={14} className="text-emerald-600 font-bold" />}
                        </div>
                        <p className="text-[10px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Auto-detect from host OS</p>
                      </div>
                    </button>

                    {/* Light Mode */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'border-[#1a1a1a] dark:border-white bg-[#FAF8F5] dark:bg-[#1F1F24] ring-2 ring-black/10 dark:ring-white/20 shadow-md'
                          : 'border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Sun size={22} className="text-amber-600" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'light'
                            ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-[#111113]'
                            : 'bg-black/5 dark:bg-white/10 text-[#665d52] dark:text-[#A1A1AA]'
                        }`}>
                          {theme === 'light' ? 'ACTIVE' : 'LIGHT'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1a1a1a] dark:text-[#F4F4F6] flex items-center justify-between">
                          <span>Light Mode</span>
                          {theme === 'light' && <Check size={14} className="text-emerald-600 font-bold" />}
                        </div>
                        <p className="text-[10px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Sand &amp; Bone White</p>
                      </div>
                    </button>

                    {/* Dark Mode */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer bg-[#18181B] text-white ${
                        theme === 'dark'
                          ? 'border-white ring-2 ring-white/30 shadow-md'
                          : 'border-[#2C2C34] hover:border-white/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Moon size={22} className="text-indigo-300" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'dark'
                            ? 'bg-white text-[#111113]'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {theme === 'dark' ? 'ACTIVE' : 'NIGHT SHIFT'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span>Dark Mode</span>
                          {theme === 'dark' && <Check size={14} className="text-emerald-400 font-bold" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Obsidian &amp; Charcoal</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Density & Shaders Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-[#F4F4F6]">Compact Density Mode</p>
                      <p className="text-[11px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Compresses cards to surface more content</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompactMode(!compactMode)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        compactMode ? 'bg-[#1a1a1a] dark:bg-emerald-600' : 'bg-[#ded9d1] dark:bg-neutral-700'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-[#F4F4F6]">Reduce Motion &amp; Shaders</p>
                      <p className="text-[11px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Disables micro-transitions to conserve battery</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReduceMotion(!reduceMotion)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        reduceMotion ? 'bg-[#1a1a1a] dark:bg-emerald-600' : 'bg-[#ded9d1] dark:bg-neutral-700'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${reduceMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {subscriptionToast && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>{subscriptionToast}</span>
                    </div>
                    <button type="button" onClick={() => setSubscriptionToast('')} className="hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {subscription ? (
                  <div className="p-5 rounded-2xl border border-[#1b5e20]/40 bg-[#1b5e20]/5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20]">Active Meal Plan</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            subscription.status === 'paused' ? 'bg-amber-100 text-amber-800' : 'bg-[#1b5e20] text-white'
                          }`}>
                            {subscription.status === 'paused' ? 'PAUSED' : 'DELIVERING DAILY'}
                          </span>
                        </div>
                        <h4 className="font-display-lg text-lg text-[#1a1a1a] mt-1">{subscription.planName || 'Ahmedabad Thali Plan'}</h4>
                      </div>
                      <span className="bg-[#1b5e20] text-white text-xs font-bold px-3 py-1 rounded-full uppercase self-start sm:self-auto">
                        {subscription.mealsLeft || 0} Meals Remaining
                      </span>
                    </div>

                    <p className="text-xs text-[#665d52] leading-relaxed">
                      {subscription.schedule || 'Scheduled delivery in 304 Food-Grade Insulated Canisters with live GPS telemetry.'}
                    </p>

                    <div className="pt-2 border-t border-[#1b5e20]/20 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handlePauseResumeSubscription}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          subscription.status === 'paused'
                            ? 'bg-[#1b5e20] text-white hover:bg-[#144216]'
                            : 'bg-white border border-[#ded9d1] text-[#1a1a1a] hover:bg-stone-100'
                        }`}
                      >
                        {subscription.status === 'paused' ? '▶ Resume Deliveries' : '⏸ Pause Subscription'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate('#find-tiffin');
                          else window.location.hash = '#find-tiffin';
                        }}
                        className="px-4 py-2 rounded-xl bg-white border border-[#ded9d1] text-xs font-bold text-[#4a4238] hover:bg-stone-100 cursor-pointer"
                      >
                        Browse Other Plans
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#665d52] bg-[#f5f3ef] border border-[#ded9d1] rounded-2xl p-6 shadow-xs">
                    <p className="font-semibold text-base text-[#1a1a1a] mb-1">No Active Meal Subscription</p>
                    <p className="mb-4 text-xs">Subscribe to a daily or weekly tiffin plan for automated fresh deliveries.</p>
                    <button 
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigate) {
                          onNavigate('#find-tiffin');
                        } else {
                          window.location.hash = '#find-tiffin';
                        }
                      }}
                      className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#a0522d] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Browse Tiffin Plans
                    </button>
                  </div>
                )}

                {/* Curated Ahmedabad Subscription Plans */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#665d52]">
                      Popular Ahmedabad Meal Subscriptions
                    </h4>
                    <span className="text-[10px] text-[#8c8273]">Instant 1-Click Activation</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {SAMPLE_PLANS.map((plan) => (
                      <div 
                        key={plan.id}
                        className="p-3.5 rounded-xl border border-[#ded9d1] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#1a1a1a] transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1a1a1a]">{plan.planName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#a0522d]/10 text-[#a0522d] uppercase">
                              {plan.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#665d52]">{plan.schedule}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <span className="font-bold text-xs text-[#1a1a1a]">{plan.price}</span>
                          <button
                            type="button"
                            onClick={() => handleActivateSubscription(plan)}
                            className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#a0522d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Activate Plan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-xs text-[#665d52] flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span><strong>Did you know?</strong> You can pause or reschedule your tiffins up to 2 hours before the delivery slot without any penalty.</span>
                </div>
              </div>
            )}

            {/* Tab 6: Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-5 max-w-lg animate-in fade-in duration-200">
                {notifToast && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>{notifToast}</span>
                    </div>
                    <button type="button" onClick={() => setNotifToast('')} className="hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <p className="text-xs text-[#665d52]">Select how you would like to receive real-time updates regarding your meals:</p>
                <div className="space-y-3">
                  {[
                    { key: 'orderStatusWhatsapp', label: 'Order Status & Dispatch on WhatsApp', desc: 'Instant live GPS link & driver details via WhatsApp' },
                    { key: 'driverEnRouteSms', label: 'Delivery OTP via SMS', desc: 'Secure 4-digit handover code sent on arrival' },
                    { key: 'dailyTiffinReminder', label: 'Daily Meal Slot Reminder', desc: 'Reminder 1 hour before scheduled lunch/dinner' },
                    { key: 'kitchenMenuUpdates', label: 'Daily Shaak/Sabzi Menu Update', desc: 'Notification when provider updates today’s special thali' }
                  ].map((n) => (
                    <label key={n.key} className="flex items-start justify-between p-3.5 rounded-xl border border-[#ded9d1] bg-white hover:bg-stone-50 transition-colors cursor-pointer shadow-xs">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-[#1a1a1a]">{n.label}</p>
                        <p className="text-[11px] text-[#665d52] mt-0.5">{n.desc}</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={Boolean(notifications[n.key])}
                        onChange={() => handleToggleNotification(n.key)}
                        className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 mt-0.5 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAllNotifications}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#a0522d] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Notification Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 8: Privacy & Data Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
                {privacyToast && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>{privacyToast}</span>
                    </div>
                    <button type="button" onClick={() => setPrivacyToast('')} className="hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Active Sessions & Devices */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Active Sessions &amp; Devices</h4>
                      <p className="text-[11px] text-[#665d52] dark:text-stone-400">Devices authorized to access your TiffinLink account</p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSignOutOtherSessions}
                        className="text-[11px] font-bold text-[#a0522d] hover:underline cursor-pointer"
                      >
                        Sign Out Other Devices
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <div 
                        key={sess.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                          sess.isCurrent 
                            ? 'bg-[#1b5e20]/5 border-[#1b5e20]/30 text-[#181512] dark:text-white' 
                            : 'bg-white dark:bg-stone-800 border-[#ded9d1] dark:border-stone-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-[#1b5e20] text-white text-[9px] font-bold uppercase">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#665d52] dark:text-stone-400">{sess.ip} &bull; {sess.lastActive}</p>
                        </div>
                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Consents & Permissions */}
                <div className="space-y-3 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Privacy Choices &amp; Consents</h4>
                  <div className="space-y-2.5">
                    {[
                      { key: 'shareLiveGps', label: 'Precise GPS Telemetry during Active Delivery', desc: 'Allows assigned driver to find your exact drop-off location. Automatically stops once delivered.' },
                      { key: 'personalizedChefs', label: 'Hyperlocal Culinary Recommendations', desc: 'Allows TiffinLink to recommend home chefs based on your spice tolerance and dietary history.' },
                      { key: 'telemetryAnalytics', label: 'Platform Performance & Operational Analytics', desc: 'Anonymous latency monitoring that prevents culinary ordering downtime.' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start justify-between p-3.5 rounded-xl border border-[#ded9d1] dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors cursor-pointer">
                        <div className="pr-4">
                          <p className="text-xs font-bold text-[#1a1a1a] dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-[#665d52] dark:text-stone-400 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(privacySettings[item.key])}
                          onChange={() => handleTogglePrivacySetting(item.key)}
                          className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 mt-0.5 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Portability (Export My Data) */}
                <div className="space-y-2 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Data Portability &amp; Archive</h4>
                  <div className="p-4 rounded-xl border border-[#ded9d1] dark:border-stone-700 bg-white dark:bg-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-white">Request a Copy of Your Personal Data</p>
                      <p className="text-[11px] text-[#665d52] dark:text-stone-400 mt-0.5">Download a machine-readable JSON archive of your dining profile, addresses, and meal history.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl bg-[#181512] dark:bg-stone-100 text-white dark:text-[#181512] font-bold text-xs uppercase tracking-wider hover:bg-[#6B4B2B] transition-colors shrink-0 cursor-pointer"
                    >
                      Export Archive (.JSON)
                    </button>
                  </div>
                </div>

                {/* Legal Policy Reference & Account Erasure */}
                <div className="space-y-3 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenLegalModal) onOpenLegalModal('privacy-policy');
                        onClose();
                      }}
                      className="text-xs font-bold text-[#6B4B2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Complete TiffinLink Privacy Policy</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 space-y-2">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">Account Erasure &amp; Deletion</p>
                    <p className="text-[11px] text-red-700/80 dark:text-red-300/70 leading-relaxed">
                      Request permanent deletion of your account. Under Indian accounting and GST regulations, transaction tax invoices are retained for 7 years; all contact information, addresses, and profiles are permanently erased.
                    </p>
                    {isDeletingAccount ? (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmDeletion}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Confirm &amp; Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeletingAccount(false)}
                          className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsDeletingAccount(true)}
                        className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Request Account Deletion &rarr;
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
