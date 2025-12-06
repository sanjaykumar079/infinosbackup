const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Enhanced Device Schema with claiming support
const DeviceSchema = new Schema({
  name: String,
  status: { type: Boolean, default: false },
  heating: [String],
  cooling: [String],
  battery: [String],
  safety_low_temp: { type: Number, default: 0 },
  safety_high_temp: { type: Number, default: 100 },
  bag_temp: { type: Number, default: 25 },

  // User ownership
  ownerId: { type: String, default: null },      // Supabase user id (uuid) - null until claimed
  
  // Device identification & security
  deviceCode: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  deviceSecret: { 
    type: String, 
    required: true 
  },
  
  // Device metadata
  isClaimed: { type: Boolean, default: false },
  claimedAt: Date,
  manufacturingDate: { type: Date, default: Date.now },
  lastSeen: Date,
  
  // Hardware info
  hardwareVersion: { type: String, default: "v1.0" },
  firmwareVersion: { type: String, default: "1.0.0" },
}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// Index for faster queries
DeviceSchema.index({ deviceCode: 1, deviceSecret: 1 });
DeviceSchema.index({ ownerId: 1, isClaimed: 1 });

// Method to verify device secret
DeviceSchema.methods.verifySecret = function(secret) {
  return this.deviceSecret === secret;
};

// Method to claim device
DeviceSchema.methods.claim = function(userId, deviceName) {
  this.ownerId = userId;
  this.isClaimed = true;
  this.claimedAt = new Date();
  if (deviceName) this.name = deviceName;
  return this.save();
};

module.exports = Device = mongoose.model("Device", DeviceSchema);