const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
  name: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  imageUrl: { type: String, required: true },
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
