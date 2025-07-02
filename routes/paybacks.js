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
        from: debtor.member,
        to: creditor.member,
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

    // Récupérer les crédits
    const credits = await Expense.aggregate([
      { $match: { group: group._id } },
      { $unwind: "$credits" },
      { $replaceRoot: { newRoot: "$credits" } },
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
      {
        $group: {
          _id: "$member._id",
          name: { $first: "$member.name" },
          totalCredits: { $sum: "$amount" },
        },
      },
    ]);

    // Récupérer les dettes
    const debts = await Expense.aggregate([
      { $match: { group: group._id } },
      { $unwind: "$debts" },
      { $replaceRoot: { newRoot: "$debts" } },
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "member",
        },
      },
      { $unwind: "$member" },
      {
        $group: {
          _id: "$member._id",
          name: { $first: "$member.name" },
          totalDebts: { $sum: "$amount" },
        },
      },
    ]);

    // Fusionner les résultats
    const membersMap = {};

    credits.forEach((credit) => {
      membersMap[credit._id] = {
        member: credit._id,
        name: credit.name,
        totalCredits: credit.totalCredits,
        totalDebts: 0,
      };
    });

    debts.forEach((debt) => {
      const id = debt._id;
      if (!membersMap[id]) {
        membersMap[id] = {
          member: debt._id,
          name: debt.name,
          totalCredits: 0,
          totalDebts: debt.totalDebts,
        };
      } else {
        membersMap[id].totalDebts = debt.totalDebts;
      }
    });

    // Calculer le solde
    const balances = Object.values(membersMap).map((member) => ({
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
