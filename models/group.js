const mongoose = require("mongoose");

const groupSchema = mongoose.Schema({
  name: { type: String, required: true },
});

const Group = mongoose.model("groups", groupSchema);

module.exports = Group;
