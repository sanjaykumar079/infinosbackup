var express = require("express");
var router = express.Router();

const Device = require("../models/Device");
const Battery = require("../models/Battery");
const Heater = require("../models/Heater");
const Cooler = require("../models/Cooler");

// ============================================
// 🆕 DEVICE CLAIMING ENDPOINTS (ADD THESE!)
// ============================================

// POST /device/claim - Claim a device with code
router.post("/claim", async (req, res) => {
  const { deviceCode, ownerId, deviceName } = req.body;

  try {
    // Find device by code
    const device = await Device.findOne({ deviceCode });

    if (!device) {
      return res.status(404).json({ 
        message: "Device not found. Please check your code." 
      });
    }

    // Check if already claimed
    if (device.isClaimed && device.ownerId) {
      return res.status(400).json({ 
        message: "This device has already been claimed by another user." 
      });
    }

    // Claim the device
    device.ownerId = ownerId;
    device.isClaimed = true;
    device.claimedAt = new Date();
    device.lastSeen = new Date();
    if (deviceName) device.name = deviceName;

    await device.save();

    res.status(200).json({ 
      message: "Device claimed successfully!",
      device: {
        _id: device._id,
        name: device.name,
        deviceCode: device.deviceCode,
        status: device.status
      }
    });
  } catch (err) {
    console.error("Error claiming device:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /device/verify-code - Verify device code before claiming
router.get("/verify-code", async (req, res) => {
  const { deviceCode } = req.query;

  try {
    const device = await Device.findOne({ deviceCode });

    if (!device) {
      return res.status(404).json({ 
        valid: false,
        message: "Invalid device code" 
      });
    }

    if (device.isClaimed) {
      return res.status(400).json({ 
        valid: false,
        message: "Device already claimed" 
      });
    }

    res.status(200).json({ 
      valid: true,
      device: {
        deviceCode: device.deviceCode,
        hardwareVersion: device.hardwareVersion,
        manufacturingDate: device.manufacturingDate
      }
    });
  } catch (err) {
    console.error("Error verifying code:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /device/auth - Authenticate device for simulator
router.post("/auth", async (req, res) => {
  const { deviceCode, deviceSecret } = req.body;

  try {
    const device = await Device.findOne({ deviceCode });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Verify secret
    if (device.deviceSecret !== deviceSecret) {
      return res.status(401).json({ message: "Invalid device credentials" });
    }

    // Update last seen
    device.lastSeen = new Date();
    await device.save();

    res.status(200).json({ 
      authenticated: true,
      device: {
        _id: device._id,
        deviceCode: device.deviceCode,
        heating: device.heating,
        cooling: device.cooling,
        battery: device.battery
      }
    });
  } catch (err) {
    console.error("Error authenticating device:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================
// EXISTING ENDPOINTS (UPDATED)
// ============================================

router.get("/", function(req, res) {
  Device.find(function(err, data) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    } else {
      res.json(data);
    }
  });
});

// GET /device/summary - Only show claimed devices
router.get("/summary", async (req, res) => {
  const ownerId = req.query.ownerId;

  try {
    const myDevices = await Device.find({ 
      ownerId,
      isClaimed: true  // ← Only claimed devices
    });

    const total = myDevices.length;
    const online = myDevices.filter(d => d.status === true).length;
    const offline = total - online;

    res.json({
      totalDevices: total,
      onlineDevices: online,
      offlineDevices: offline,
      devices: myDevices,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// ✅ Get only claimed devices that belong to a specific user
router.get("/my-devices", async (req, res) => {
  const ownerId = req.query.ownerId;

  try {
    const devices = await Device.find({ 
      ownerId,
      isClaimed: true  // ← Only claimed devices
    }).sort({ claimedAt: -1 });

    res.status(200).json(devices);
  } catch (err) {
    console.error("Error fetching user-specific devices:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// POST /device/add_device - Keep for backward compatibility
router.post("/add_device", (req, res) => {
  const newDevice = new Device({
    name: req.body.name,
    status: req.body.status,
    heating: req.body.heating,
    cooling: req.body.cooling,
    battery: req.body.battery,
    safety_low_temp: req.body.safety_low_temp,
    safety_high_temp: req.body.safety_high_temp,
    bag_temp: req.body.bag_temp,
    ownerId: req.body.ownerId,
    deviceCode: req.body.deviceCode || `DEV-${Date.now()}`, // Generate if not provided
    deviceSecret: req.body.deviceSecret || require('crypto').randomBytes(32).toString('hex'),
    isClaimed: true,  // Manually added devices are auto-claimed
    claimedAt: new Date()
  });
  
  console.log(newDevice);
  newDevice.save()
    .then(device => {
      res.status(200).json(device);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

// ============================================
// HEATER ENDPOINTS
// ============================================

router.post("/add_heater", (req, res) => {
  const newHeater = new Heater({
    name: req.body.name,
    desired_temp: req.body.desired_temp,
    observed_temp: req.body.observed_temp,
    continous: req.body.continous,
    discrete: req.body.discrete,
    fan: req.body.fan,
    observed_humidity: req.body.observed_humidity,
  });

  console.log(newHeater);
  newHeater.save()
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/ass_heater", (req, res) => {
  const heater_id = req.body.heater_id;
  const device_id = req.body.device_id;
  Device.updateOne({"_id": device_id}, {$push: {heating: heater_id}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_heater", (req, res) => {
  const heater_id = req.body.heater_id;
  const desired_temp = req.body.desired_temp;
  const cont = req.body.cont;
  const disc = req.body.disc;
  const fan = req.body.fan;
  Heater.updateOne({"_id": heater_id}, {$set: {desired_temp: desired_temp, continous: cont, discrete: disc, fan: fan}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_heater_temp", (req, res) => {
  const heater_id = req.body.heater_id;
  const obs_temp = req.body.obs_temp;
  var dateUTC = new Date();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  var x = dateIST.getHours();
  var y = dateIST.getMinutes();
  var z = dateIST.getSeconds();
  var time = x + ":" + y + ":" + z;
  Heater.updateOne({"_id": heater_id}, {$push: {observed_temp: {"obs_temp": obs_temp, "Date": time, "TimeStamp": dateIST}}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_heater_humidity", (req, res) => {
  const heater_id = req.body.heater_id;
  const obs_humidity = req.body.obs_humidity;
  var dateUTC = new Date();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  var x = dateIST.getHours();
  var y = dateIST.getMinutes();
  var z = dateIST.getSeconds();
  var time = x + ":" + y + ":" + z;
  Heater.updateOne({"_id": heater_id}, {$push: {observed_humidity: {"obs_humidity": obs_humidity, "Date": time, "TimeStamp": dateIST}}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.get("/get_heaters", (req, res) => {
  const ids = req.query.heater_ids;
  Heater.find({_id: {$in: ids}})
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

// ============================================
// COOLER ENDPOINTS
// ============================================

router.post("/add_cooler", (req, res) => {
  const newCooler = new Cooler({
    name: req.body.name,
    desired_temp: req.body.desired_temp,
    observed_temp: req.body.observed_temp,
    continous: req.body.continous,
    discrete: req.body.discrete,
    fan: req.body.fan,
    observed_humidity: req.body.observed_humidity,
  });

  console.log(newCooler);
  newCooler.save()
    .then(cooler => {
      res.status(200).json(cooler);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/ass_cooler", (req, res) => {
  const cooler_id = req.body.cooler_id;
  const device_id = req.body.device_id;
  Device.updateOne({"_id": device_id}, {$push: {cooling: cooler_id}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_cooler", (req, res) => {
  const cooler_id = req.body.cooler_id;
  const desired_temp = req.body.desired_temp;
  const cont = req.body.cont;
  const disc = req.body.disc;
  const fan = req.body.fan;

  Cooler.updateOne({"_id": cooler_id}, {$set: {desired_temp: desired_temp, continous: cont, discrete: disc, fan: fan}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_cooler_temp", (req, res) => {
  const cooler_id = req.body.cooler_id;
  const obs_temp = req.body.obs_temp;
  var dateUTC = new Date();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  var x = dateIST.getHours();
  var y = dateIST.getMinutes();
  var z = dateIST.getSeconds();
  var time = x + ":" + y + ":" + z;
  Cooler.updateOne({"_id": cooler_id}, {$push: {observed_temp: {"obs_temp": obs_temp, "Date": time, "TimeStamp": dateIST}}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_cooler_humidity", (req, res) => {
  const cooler_id = req.body.cooler_id;
  const obs_humidity = req.body.obs_humidity;
  var dateUTC = new Date();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  var x = dateIST.getHours();
  var y = dateIST.getMinutes();
  var z = dateIST.getSeconds();
  var time = x + ":" + y + ":" + z;
  Cooler.updateOne({"_id": cooler_id}, {$push: {observed_humidity: {"obs_humidity": obs_humidity, "Date": time, "TimeStamp": dateIST}}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.get("/get_coolers", (req, res) => {
  const ids = req.query.cooler_ids;
  Cooler.find({_id: {$in: ids}})
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

// ============================================
// BATTERY ENDPOINTS
// ============================================

router.post("/add_battery", (req, res) => {
  const newBattery = new Battery({
    name: req.body.name,
    battery_temp: req.body.battery_temp,
    fan: req.body.fan,
    battery_charge_left: req.body.battery_charge_left,
    observed_humidity: req.body.observed_humidity,
  });

  console.log(newBattery);
  newBattery.save()
    .then(battery => {
      res.status(200).json(battery);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/ass_battery", (req, res) => {
  const battery_id = req.body.battery_id;
  const device_id = req.body.device_id;
  Device.updateOne({"_id": device_id}, {$push: {battery: battery_id}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_battery", (req, res) => {
  const battery_id = req.body.battery_id;
  const fan = req.body.fan;
  Battery.updateOne({"_id": battery_id}, {$set: {fan: fan}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.post("/update_battery_charge", (req, res) => {
  const battery_id = req.body.battery_id;
  const charge = req.body.charge;
  var dateUTC = new Date();
  var dateIST = new Date(dateUTC);
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  var x = dateIST.getHours();
  var y = dateIST.getMinutes();
  var z = dateIST.getSeconds();
  var time = x + ":" + y + ":" + z;
  Battery.updateOne({"_id": battery_id}, {$push: {battery_charge_left: {"battery_charge_left": charge, "Date": time, "TimeStamp": dateIST}}})
    .then(heater => {
      res.status(200).json(heater);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.get("/get_batteries", (req, res) => {
  const ids = req.query.battery_ids;
  Battery.find({_id: {$in: ids}})
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

// ============================================
// DEVICE ENDPOINTS
// ============================================

router.post("/update_device", (req, res) => {
  const device_id = req.body.device_id;
  const status = req.body.status;

  Device.updateOne({"_id": device_id}, {$set: {status: status, lastSeen: new Date()}})
    .then(device => {
      res.status(200).json(device);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

router.get("/get_device", (req, res) => {
  const id = req.query.device_id;
  Device.findById(id, function(err, data) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Device not found" });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});

module.exports = router;