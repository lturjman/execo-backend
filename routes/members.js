var express = require("express");
var router = express.Router({ mergeParams: true });
const {
  Types: { ObjectId },
} = require("mongoose");

require("../models/member");
const Member = require("../models/member");
const Group = require("../models/group");

async function updateMembersShare(group) {
  const members = await Member.find({ group: group._id });
  const totalLeftoverQuery = await Member.aggregate([
    { $match: { group: group._id } },
    {
      $group: {
        _id: null,
        totalLeftover: { $sum: "$leftover" },
      },
    },
  ]);

  members.forEach(async (member) => {
    member.share = member.leftover / totalLeftoverQuery[0].totalLeftover;
    await member.save();
  });
}

async function findGroup(req, res) {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  return group;
}

router.get("/", async (req, res) => {
  const group = await findGroup(req, res);

  return Member.find({ group }).then((data) => {
    res.json({ data });
  });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req, res);
  const leftover =
    req.body.member.monthlyRevenue - req.body.member.monthlyCharges;

  return Member.create({ ...req.body.member, group, leftover }).then(
    async (data) => {
      await updateMembersShare(group);
      res.json({ data });
    }
  );
});

router.put("/:id", async (req, res) => {
  const group = await findGroup(req, res);
  const leftover =
    req.body.member.monthlyRevenue - req.body.member.monthlyCharges;

  return Member.findOneAndUpdate(
    { group, _id: req.params.id },
    { ...req.body.member, leftover }
  ).then(async (data) => {
    await updateMembersShare(group);
    res.json({ data });
  });
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req, res);

  return Member.findOneAndDelete({ group, _id: req.params.id }).then(
    async (data) => {
      await updateMembersShare(group);
      res.json({ data });
    }
  );
});

module.exports = router;
