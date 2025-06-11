const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema({
  name: String,
  amount: Number,
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "members" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "groups" },
});

const Expense = mongoose.model("expenses", expenseSchema);

module.exports = Expense;
