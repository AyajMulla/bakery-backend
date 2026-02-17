require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const existing = await User.findOne({ email: "mullaayan111@gmail.com" });
    if (existing) {
      console.log("User already exists");
      process.exit();
    }

    await User.create({
      username: "Salim",
      mobile: "8806900405",
      email: "mullaayan111@gmail.com",
      password: "Salim786",
      role: "owner"
    });

    console.log("Owner created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
