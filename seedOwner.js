require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const existing = await User.findOne({ email: "ayajmulla2341@gmail.com" });
    if (existing) {
      console.log("User already exists");
      process.exit();
    }

    await User.create({
      username: "Ayaj",
      mobile: "9359405574",
      email: "ayajmulla2341@gmail.com",
      password: "23412341",
      role: "owner"
    });

    console.log("Owner created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
