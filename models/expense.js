const mongoose = require("mongoose");

const debtSchema = mongoose.Schema({
  amount: { type: Number, required: true },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
});

const creditSchema = mongoose.Schema({
  amount: { type: Number, required: true },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
});

const expenseSchema = mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  debts: [debtSchema],
  credits: [creditSchema],
});

expenseSchema.pre("validate", function (next) {
  const totalDebts = this.debts.reduce((sum, debts) => sum + debts.amount, 0);
  const totalCredits = this.credits.reduce(
    (sum, credits) => sum + credits.amount,
    0
  );

  if (
    Math.abs(totalDebts - this.amount) === 0 ||
    Math.abs(totalCredits - this.amount) === 0
  ) {
    return next(
      this.invalidate(
        "amount",
        "La somme des crédits et des dettes doit être égale au montant."
      )
    );
  }

  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
