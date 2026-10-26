const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    password: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'provider', 'customer', 'delivery'],
      default: 'customer'
    },
    image: {
      type: String,
      default: ''
    },
    kitchenPhoto: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String,
      default: null,
      select: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    savedAddresses: [
      {
        label: { type: String, default: 'Home' },
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        street: { type: String, default: '' },
        area: { type: String, default: '' },
        city: { type: String, default: 'Ahmedabad' },
        state: { type: String, default: 'Gujarat' },
        pincode: { type: String, default: '' },
        lat: { type: Number, default: 23.0300 },
        lng: { type: Number, default: 72.5178 },
        landmark: { type: String, default: '' },
        isDefault: { type: Boolean, default: false }
      }
    ],
    paymentMethods: [
      {
        id: { type: String },
        type: { type: String, default: 'UPI' },
        detail: { type: String, default: '' },
        label: { type: String, default: 'UPI' },
        isDefault: { type: Boolean, default: false }
      }
    ],
    preferences: {
      dietary: { type: String, default: 'Veg' },
      rotliType: { type: String, default: 'Soft Phulka Rotli (Ghee)' },
      spiceLevel: { type: String, default: 'Medium Spice' },
      noOnionGarlic: { type: Boolean, default: false },
      lessOil: { type: Boolean, default: false }
    },
    subscription: {
      planName: { type: String, default: '' },
      mealsLeft: { type: Number, default: 0 },
      schedule: { type: String, default: '' },
      status: { type: String, default: 'inactive' },
      startDate: { type: Date },
      endDate: { type: Date }
    },
    notifications: {
      orderStatusWhatsapp: { type: Boolean, default: true },
      driverEnRouteSms: { type: Boolean, default: true },
      dailyTiffinReminder: { type: Boolean, default: true },
      kitchenMenuUpdates: { type: Boolean, default: false },
      promotions: { type: Boolean, default: false }
    },
    privacySettings: {
      shareLiveGps: { type: Boolean, default: true },
      personalizedChefs: { type: Boolean, default: true },
      telemetryAnalytics: { type: Boolean, default: true },
      retainOrderHistory: { type: Boolean, default: true }
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
