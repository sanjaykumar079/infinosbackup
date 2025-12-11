// const mongoose = require("mongoose");
// const Device = require("./models/Device");
// const Heater = require("./models/Heater");
// const Cooler = require("./models/Cooler");
// const Battery = require("./models/Battery");

// const DB_NAME = "sanju";
// const MONGO_URI = `mongodb+srv://sanju:sanju@cluster0.rl6u4ea.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// async function setupComponents() {
//   try {
//     // Find your device by code
//     const device = await Device.findOne({ deviceCode: "INF-A7B3-9K2L" });
    
//     if (!device) {
//       console.log("Device not found!");
//       return;
//     }

//     // Create Heater
//     const heater = new Heater({
//       name: "Heater 1",
//       desired_temp: 30,
//       observed_temp: [],
//       continous: true,
//       discrete: false,
//       fan: false,
//       observed_humidity: []
//     });
//     await heater.save();

//     // Create Cooler
//     const cooler = new Cooler({
//       name: "Cooler 1",
//       desired_temp: 5,
//       observed_temp: [],
//       continous: true,
//       discrete: false,
//       fan: false,
//       observed_humidity: []
//     });
//     await cooler.save();

//     // Create Battery
//     const battery = new Battery({
//       name: "Battery 1",
//       battery_temp: [],
//       fan: false,
//       battery_charge_left: [],
//       observed_humidity: []
//     });
//     await battery.save();

//     // Attach to device
//     device.heating.push(heater._id);
//     device.cooling.push(cooler._id);
//     device.battery.push(battery._id);
//     await device.save();

//     console.log("✅ Components added!");
//     console.log("Heater ID:", heater._id);
//     console.log("Cooler ID:", cooler._id);
//     console.log("Battery ID:", battery._id);

//     mongoose.disconnect();
//   } catch (err) {
//     console.error(err);
//     mongoose.disconnect();
//   }
// }

// setupComponents();