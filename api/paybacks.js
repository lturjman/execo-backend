const express = require("express");
const router = express.Router({ mergeParams: true });

const Group = require("../models/group");
const Expense = require("../models/expense");

async function findGroup(req, res) {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });
  return group;
}

// Fonction utilitaire pour calculer les remboursements
function computePaybacks(balances) {
  const creditors = balances
    .filter((balance) => balance.balance > 0)
    .map((balance) => ({ ...balance }));
  const debtors = balances
    .filter((balance) => balance.balance < 0)
    .map((balance) => ({ ...balance }));

  const paybacks = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amount > 0) {
      paybacks.push({
        from: { _id: debtor.member, name: debtor.name },
        to: { _id: creditor.member, name: creditor.name },
        amount,
      });

      debtor.balance += amount;
      creditor.balance -= amount;
    }

    if (Math.abs(debtor.balance) <= 0) i++;
    if (Math.abs(creditor.balance) <= 0) j++;
  }

  return paybacks;
}

router.get("/", async (req, res) => {
  try {
    const group = await findGroup(req, res);
    if (!group) return;

    const membersById = new Map(
      group.members.map((member) => [member._id.toString(), member]),
    );

    const expenses = await Expense.find({ group });

    const balancesMap = {};
    const ensureBalance = (memberId) => {
      const key = String(memberId);
      if (!balancesMap[key]) {
        balancesMap[key] = {
          member: memberId,
          name: membersById.get(key)?.nickname || null,
          totalCredits: 0,
          totalDebts: 0,
        };
      }
      return balancesMap[key];
    };

    expenses.forEach((expense) => {
      expense.credits.forEach((credit) => {
        ensureBalance(credit.member).totalCredits += credit.amount;
      });
      expense.debts.forEach((debt) => {
        ensureBalance(debt.member).totalDebts += debt.amount;
      });
    });

    // Calculer le solde
    const balances = Object.values(balancesMap).map((member) => ({
      ...member,
      balance: member.totalCredits - member.totalDebts,
    }));

    const paybacks = computePaybacks(balances);

    // Réponse finale
    res.json({ data: { balances, paybacks } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
