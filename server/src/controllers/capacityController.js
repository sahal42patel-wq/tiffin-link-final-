const KitchenCapacity = require('../models/KitchenCapacity');
const ProviderSetting = require('../models/ProviderSetting');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to format Date as YYYY-MM-DD in local time
const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for human readable date label (Today, Tomorrow, 18 Aug...)
const getDateLabel = (idx, dateObj) => {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// @desc    Get real-time Kitchen Capacity & Multi-day Schedule from MongoDB
// @route   GET /api/capacity
const getCapacity = async (req, res) => {
  try {
    const providerId = req.providerId;
    let globalMaxCapacity = 30;
    let autoStopOrders = true;
    let allowOverbooking = false;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = await ProviderSetting.create({ providerId });
      }
      const Provider = require('../models/Provider');
      const prov = await Provider.findById(providerId).lean();
      const pMax = Number(prov?.maxMeals);
      globalMaxCapacity = (!isNaN(pMax) && pMax > 0) ? pMax : (settings.tiffin?.maxDailyLimit ?? 30);
      autoStopOrders = settings.tiffin?.autoPauseLimit ?? true;
      allowOverbooking = settings.tiffin?.allowOverbooking ?? false;
    }

    const now = new Date();
    const daysList = [];

    // Fetch qualifying orders belonging to this provider
    const allOrders = (await isDbConnected()) 
      ? await Order.find({ 
          providerId, 
          status: { $nin: ['Cancelled', 'CANCELLED', 'REJECTED', 'Rejected', 'PAYMENT_FAILED', 'DELIVERY_FAILED'] } 
        }) 
      : [];

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() + i);
      const dateKey = formatDateKey(dateObj);
      const label = getDateLabel(i, dateObj);

      let record = null;
      if (await isDbConnected()) {
        record = await KitchenCapacity.findOne({ providerId, date: dateKey });
      }

      const dayMaxCapacity = record ? record.maxCapacity : globalMaxCapacity;
      const dayAutoStop = record ? record.autoStopOrders : autoStopOrders;
      const dayAllowOverbooking = record ? record.allowOverbooking : allowOverbooking;

      // Calculate booked count from real orders on this date
      const dayOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (i === 0) {
          const isSameDateKey = formatDateKey(orderDate) === dateKey;
          const isWithin24h = (now - orderDate) >= 0 && (now - orderDate) <= 24 * 60 * 60 * 1000;
          return isSameDateKey || isWithin24h;
        }
        return formatDateKey(orderDate) === dateKey;
      });

      // Sum meal quantities of qualifying orders
      const bookedCount = dayOrders.reduce((sum, o) => sum + Math.max(1, Number(o.quantity) || 1), 0);
      const availableCapacity = Math.max(0, dayMaxCapacity - bookedCount);
      
      let status = 'OPEN';
      if (bookedCount >= dayMaxCapacity && !dayAllowOverbooking) {
        status = 'FULL';
      }

      daysList.push({
        date: dateKey,
        dateLabel: label,
        maxCapacity: dayMaxCapacity,
        bookedCount,
        availableCapacity,
        autoStopOrders: dayAutoStop,
        allowOverbooking: dayAllowOverbooking,
        status
      });
    }

    const todayData = daysList[0] || {
      date: formatDateKey(now),
      dateLabel: 'Today',
      maxCapacity: globalMaxCapacity,
      bookedCount: 0,
      availableCapacity: globalMaxCapacity,
      autoStopOrders,
      allowOverbooking,
      status: 'OPEN'
    };

    const usagePercentage = todayData.maxCapacity > 0 
      ? Math.min(100, Math.round((todayData.bookedCount / todayData.maxCapacity) * 100))
      : 0;

    return res.json({
      success: true,
      data: {
        today: {
          totalCapacity: todayData.maxCapacity,
          bookedCount: todayData.bookedCount,
          remainingCapacity: todayData.availableCapacity,
          usagePercentage,
          status: todayData.status
        },
        dailySchedule: daysList,
        settings: {
          maxDailyOrders: globalMaxCapacity,
          autoStopOrders,
          allowOverbooking
        }
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Error fetching capacity:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update global capacity settings
// @route   POST /api/capacity/settings
const updateCapacitySettings = async (req, res) => {
  try {
    const providerId = req.providerId;
    const { maxDailyOrders, autoStopOrders, allowOverbooking } = req.body;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = new ProviderSetting({ providerId });
      }

      if (maxDailyOrders !== undefined) settings.tiffin.maxDailyLimit = Number(maxDailyOrders);
      if (autoStopOrders !== undefined) settings.tiffin.autoPauseLimit = Boolean(autoStopOrders);
      if (allowOverbooking !== undefined) settings.tiffin.allowOverbooking = Boolean(allowOverbooking);
      settings.updatedAt = new Date();
      await settings.save();

      // Also update Provider doc maxMeals
      const Provider = require('../models/Provider');
      if (maxDailyOrders !== undefined) {
        await Provider.findByIdAndUpdate(providerId, { $set: { maxMeals: Number(maxDailyOrders) } });
      }

      // Also update today's capacity document
      const todayKey = formatDateKey(new Date());
      await KitchenCapacity.findOneAndUpdate(
        { providerId, date: todayKey },
        { 
          $set: { 
            maxCapacity: Number(maxDailyOrders), 
            autoStopOrders: Boolean(autoStopOrders),
            allowOverbooking: Boolean(allowOverbooking),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      await broadcastProviderCapacity(providerId);
    }

    return res.json({
      success: true,
      message: '✓ Kitchen capacity settings saved successfully!'
    });
  } catch (error) {
    console.error('Error updating capacity settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update capacity settings: ' + error.message });
  }
};

// @desc    Update specific date capacity limit
// @route   PUT /api/capacity/date
const updateDateCapacity = async (req, res) => {
  try {
    const providerId = req.providerId;
    const { date, maxCapacity } = req.body;

    if (!date || maxCapacity === undefined) {
      return res.status(400).json({ success: false, message: 'Date and maxCapacity are required' });
    }

    if (await isDbConnected()) {
      const updated = await KitchenCapacity.findOneAndUpdate(
        { providerId, date },
        {
          $set: {
            maxCapacity: Number(maxCapacity),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      await broadcastProviderCapacity(providerId, date);
      return res.json({ success: true, message: `Capacity updated for ${date}`, data: updated });
    }

    return res.json({ success: true, message: `Capacity updated for ${date} (fallback)` });
  } catch (error) {
    console.error('Error updating date capacity:', error);
    res.status(500).json({ success: false, message: 'Failed to update date capacity: ' + error.message });
  }
};

// @desc    Check if today's capacity allows new order
// @route   GET /api/capacity/check-today
const checkCapacityAvailable = async (req, res) => {
  try {
    const providerId = req.providerId || req.query.providerId;
    const now = new Date();
    const todayKey = formatDateKey(now);

    let globalMax = 50;
    let autoStop = true;
    let allowOver = false;

    if (await isDbConnected() && providerId) {
      const settings = await ProviderSetting.findOne({ providerId });
      if (settings) {
        globalMax = settings.tiffin?.maxDailyLimit ?? 50;
        autoStop = settings.tiffin?.autoPauseLimit ?? true;
        allowOver = settings.tiffin?.allowOverbooking ?? false;
      }

      const todayCap = await KitchenCapacity.findOne({ providerId, date: todayKey });
      if (todayCap) {
        globalMax = todayCap.maxCapacity;
        autoStop = todayCap.autoStopOrders;
        allowOver = todayCap.allowOverbooking;
      }

      const todayOrders = await Order.find({ providerId, status: { $ne: 'Cancelled' } });
      const bookedCount = todayOrders.filter(o => formatDateKey(new Date(o.createdAt)) === todayKey)
                                     .reduce((sum, o) => sum + (o.quantity || 1), 0);

      const isFull = bookedCount >= globalMax && autoStop && !allowOver;

      return res.json({
        success: true,
        canAcceptOrder: !isFull,
        bookedCount,
        maxCapacity: globalMax,
        message: isFull ? 'Kitchen is currently at full capacity.' : 'Kitchen accepting orders.'
      });
    }

    return res.json({ success: true, canAcceptOrder: true, message: 'Kitchen accepting orders.' });
  } catch (error) {
    console.error('Error checking capacity:', error);
    res.status(500).json({ success: false, message: 'Failed to check capacity' });
  }
};

const parseCutoffTimeToDate = (timeStr, targetDateObj) => {
  if (!timeStr) return null;
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const d = new Date(targetDateObj || new Date());
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const calculateProviderCapacityData = async (providerId, targetDateStr = null, cachedProvider = null, cachedTiffins = null) => {
  const Provider = require('../models/Provider');
  const Tiffin = require('../models/Tiffin');
  const KitchenCapacity = require('../models/KitchenCapacity');
  const Order = require('../models/Order');

  const now = new Date();
  const dateKey = targetDateStr || formatDateKey(now);

  const prov = cachedProvider || (await Provider.findById(providerId).lean());
  const tiffins = cachedTiffins || (await Tiffin.find({ providerId: String(providerId), status: 'Active' }).lean());

  const primaryTiffin = (Array.isArray(tiffins) ? tiffins.find(t => t.status === 'Active') || tiffins[0] : null) || {};
  const tiffinId = primaryTiffin._id ? String(primaryTiffin._id) : '';
  const tiffinName = primaryTiffin.name || prov?.name || 'Homestyle Meal';
  const mealType = primaryTiffin.mealType || prov?.mealType || 'Lunch';
  const orderCutoff = primaryTiffin.orderCutoff || '11:30 AM';
  const availableDays = primaryTiffin.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const serviceArea = primaryTiffin.area || prov?.address?.locality || 'All Localities';

  // 1. Determine Total Capacity for this date
  let totalCapacity = 30;
  const capRecord = await KitchenCapacity.findOne({ providerId: String(providerId), date: dateKey }).lean();
  if (capRecord && typeof capRecord.maxCapacity === 'number' && capRecord.maxCapacity > 0) {
    totalCapacity = capRecord.maxCapacity;
  } else if (prov && !isNaN(Number(prov.maxMeals)) && Number(prov.maxMeals) > 0) {
    totalCapacity = Number(prov.maxMeals);
  } else if (prov && !isNaN(Number(prov.maxCapacity)) && Number(prov.maxCapacity) > 0) {
    totalCapacity = Number(prov.maxCapacity);
  } else if (primaryTiffin && !isNaN(Number(primaryTiffin.capacity)) && Number(primaryTiffin.capacity) > 0) {
    totalCapacity = Number(primaryTiffin.capacity);
  }

  // 2. Calculate Confirmed/Active Orders Consumption
  const startOfDay = new Date(dateKey + 'T00:00:00.000Z');
  const endOfDay = new Date(dateKey + 'T23:59:59.999Z');

  const orders = await Order.find({
    providerId: String(providerId),
    status: { $nin: ['Cancelled', 'CANCELLED', 'REJECTED', 'Rejected', 'PAYMENT_FAILED', 'DELIVERY_FAILED', 'FAILED'] },
    createdAt: { $gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000), $lte: new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000) }
  }).select('quantity createdAt deliverySlot status').lean();

  const isToday = dateKey === formatDateKey(now);
  const matchingOrders = orders.filter(o => {
    const oDateKey = formatDateKey(new Date(o.createdAt));
    if (isToday) {
      const oTime = new Date(o.createdAt).getTime();
      const within24h = (now.getTime() - oTime) >= 0 && (now.getTime() - oTime) <= 24 * 60 * 60 * 1000;
      return oDateKey === dateKey || within24h;
    }
    return oDateKey === dateKey;
  });

  const consumedSlots = matchingOrders.reduce((sum, o) => sum + Math.max(1, Number(o.quantity) || 1), 0);
  const remainingSlots = Math.max(0, totalCapacity - consumedSlots);
  const consumedPercentage = totalCapacity > 0 ? Math.min(100, Math.max(0, Math.round((consumedSlots / totalCapacity) * 100))) : 0;

  // 3. Cutoff Validation
  let isCutoffPassed = false;
  if (isToday) {
    const cutoffDate = parseCutoffTimeToDate(orderCutoff, now);
    if (cutoffDate && now.getTime() > cutoffDate.getTime()) {
      isCutoffPassed = true;
    }
  } else {
    const targetDate = new Date(dateKey + 'T23:59:59');
    if (targetDate.getTime() < now.getTime()) {
      isCutoffPassed = true;
    }
  }

  let availabilityStatus = 'AVAILABLE';
  if (prov && prov.isAcceptingOrders === false) {
    availabilityStatus = 'KITCHEN_PAUSED';
  } else if (isCutoffPassed) {
    availabilityStatus = 'CUTOFF_PASSED';
  } else if (remainingSlots <= 0) {
    availabilityStatus = 'SOLD_OUT';
  }

  return {
    providerId: String(providerId),
    tiffinId,
    tiffinName,
    mealType,
    totalCapacity,
    consumedSlots,
    remainingSlots,
    availableSlots: remainingSlots,
    consumedPercentage,
    orderCutoff,
    isCutoffPassed,
    availabilityStatus,
    availableDays,
    serviceArea,
    date: dateKey,
    isToday
  };
};

// Helper to broadcast real-time capacity and availability across Socket.IO
const broadcastProviderCapacity = async (providerId, targetDate = null) => {
  try {
    const { getIO, emitToProvider } = require('../services/socketService');
    const capacityData = await calculateProviderCapacityData(providerId, targetDate);
    const pIdStr = String(providerId);

    // Emit to provider room
    emitToProvider(pIdStr, 'capacity:updated', capacityData);
    emitToProvider(pIdStr, 'tiffin:availability:updated', capacityData);

    // Broadcast globally to all diners / clients
    const io = getIO();
    if (io) {
      io.emit('capacity:updated', capacityData);
      io.emit('tiffin:availability:updated', capacityData);
    }
    return capacityData;
  } catch (err) {
    console.warn('broadcastProviderCapacity warning:', err.message);
    return null;
  }
};

// @desc    Get real-time dynamic availability for any provider (Public / Diner Endpoint)
// @route   GET /api/capacity/availability/:providerId
const getPublicProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    const targetDateStr = req.query.date || null;

    if (!providerId) {
      return res.status(400).json({ success: false, message: 'Provider ID is required' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    const data = await calculateProviderCapacityData(providerId, targetDateStr);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting public provider availability:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate provider availability: ' + error.message });
  }
};

module.exports = {
  getCapacity,
  updateCapacitySettings,
  updateDateCapacity,
  checkCapacityAvailable,
  calculateProviderCapacityData,
  broadcastProviderCapacity,
  parseCutoffTimeToDate,
  getPublicProviderAvailability
};
