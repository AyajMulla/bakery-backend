// seedUser.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const exists = await User.findOne({ mobile: "8806900405" });

  if (!exists) {
    await User.create({
      name: "Salim",
      mobile: "8806900405",
      password: "Salim786"
    });
    console.log("User created");
  } else {
    console.log("User already exists");
  }

  process.exit();
});
