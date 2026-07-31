const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
  nickname: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  owner: { type: Boolean },
  share: Number,
});

const groupSchema = mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },
  members: [memberSchema],
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
