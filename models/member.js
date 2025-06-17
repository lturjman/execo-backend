const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
  name: { type: String, required: true },
  monthlyRevenue: { type: Number, required: true },
  monthlyCharges: { type: Number, required: true },
  share: Number,
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
