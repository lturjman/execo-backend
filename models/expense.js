const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema({
  name: String,
  amount: Number,
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "members",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "groups",
    required: true,
  },
});

const Expense = mongoose.model("expenses", expenseSchema);

module.exports = Expense;
