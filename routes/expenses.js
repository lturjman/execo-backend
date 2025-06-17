var express = require("express");
var router = express.Router({ mergeParams: true });

const Group = require("../models/group");
const Expense = require("../models/expense");

async function findGroup(req) {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  return group;
}

router.get("/", async (req, res) => {
  const group = await findGroup(req, res);

  return Expense.find({ group })
    .populate("member")
    .then((data) => {
      res.json({ data });
    });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req, res);

  return Expense.create({
    ...req.body.expense,
    group,
  }).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", async (req, res) => {
  const group = await findGroup(req, res);

  return Expense.findOneAndUpdate(
    { _id: req.params.id, group },
    req.body.expense,
    {
      new: true,
    }
  ).then((data) => {
    res.json({ data });
  });
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req, res);

  return Expense.findOneAndDelete({ _id: req.params.id, group }).then(
    (data) => {
      res.json({ data });
    }
  );
});

module.exports = router;
