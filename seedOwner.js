require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected");

    const existing = await User.findOne({ mobile: "8806900405" });

    if (existing) {
      console.log("User already exists");
      process.exit();
    }

    await User.create({
      name: "Salim",
      mobile: "8806900405",
      password: "salim786"
    });

    console.log("Owner created successfully");
    process.exit();
  })
  .catch(err => {
    console.log(err);
    process.exit();
  });
