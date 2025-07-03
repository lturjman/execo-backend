const mongoose = require("mongoose");
const {
  validateTotalEqualsAmount,
} = require("../middlewares/validateTotalEqualsAmount.js");

const debtSchema = mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: (props) => `${props.value} n'est pas un entier`,
    },
  },

  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
});

const creditSchema = mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: (props) => `${props.value} n'est pas un entier`,
    },
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
});

const expenseSchema = mongoose.Schema({
  name: { type: String, required: true },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: (props) => `${props.value} n'est pas un entier`,
    },
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  debts: {
    type: [debtSchema],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "Il doit y avoir au moins une dette.",
    },
  },
  credits: {
    type: [creditSchema],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "Il doit y avoir au moins un crédit.",
    },
  },
});

expenseSchema.pre("validate", function (next) {
  if (!validateTotalEqualsAmount(this.debts, this.amount)) {
    return next(
      this.invalidate(
        "amount",
        "La somme des dettes ne correspond pas au montant."
      )
    );
  }

  next();
});

expenseSchema.pre("validate", function (next) {
  if (!validateTotalEqualsAmount(this.credits, this.amount)) {
    return next(
      this.invalidate(
        "amount",
        "La somme des crédits ne correspond pas au montant."
      )
    );
  }

  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
