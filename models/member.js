const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
  name: String,
  monthlyRevenue: Number,
  monthlyCharges: Number,
  share: Number,
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups",
    required: true,
  },
});

const Member = mongoose.model("members", memberSchema);

module.exports = Member;
