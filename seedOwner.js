require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected");

  const exists = await User.findOne({ email: "ayajmulla2341@gmail.com" });
  if (exists) {
    console.log("User already exists");
    process.exit();
  }

  await User.create({
    name: "Ayaj",
    email: "ayajmulla2341@gmail.com",
    mobile: "9359405574",
    password: "Ayaj@123",
    role: "owner"
  });

  console.log("Owner created");
  process.exit();
});
