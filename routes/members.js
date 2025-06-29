var express = require("express");
var router = express.Router({ mergeParams: true });
const {
  Types: { ObjectId },
} = require("mongoose");

require("../models/member");
const Member = require("../models/member");
const Group = require("../models/group");

async function findGroup(req) {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  return group;
}

router.get("/", async (req, res) => {
  const group = await findGroup(req);

  return Member.find({ group }).then((data) => {
    res.json({ data });
  });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req);

  return Member.create({ ...req.body.member, group }).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", async (req, res) => {
  const group = await findGroup(req);
  const leftover =
    req.body.member.monthlyRevenue - req.body.member.monthlyCharges;

  const totalLeftoverQuery = await Member.aggregate([
    {
      $match: {
        group: group._id,
        _id: { $ne: new ObjectId(req.params.id) },
      },
    },
    {
      $group: {
        _id: null,
        totalLeftover: { $sum: "$leftover" },
      },
    },
  ]);

  const share = leftover / (totalLeftoverQuery[0].totalLeftover + leftover);

  return Member.findOneAndUpdate(
    { group, _id: req.params.id },
    { ...req.body.member, leftover, share }
  ).then((data) => {
    res.json({ data });
  });
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req);

  return Member.findOneAndDelete({ group, _id: req.params.id }).then((data) => {
    res.json({ data });
  });
});

module.exports = router;
