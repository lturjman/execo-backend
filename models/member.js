const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
  name: String,
  monthlyRevenue: Number,
  monthlyCharges: Number,
  share: Number,
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
