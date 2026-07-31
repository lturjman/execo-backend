const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
monthlyRevenue: { type: Number, required: true },
  monthlyCharges: { type: Number, required: true },
  leftover: Number,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
