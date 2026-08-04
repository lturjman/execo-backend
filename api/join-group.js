var express = require("express");
var router = express.Router();
require("../models/group");
const Group = require("../models/group");
const authMiddleware = require("../middlewares/auth");

router.get("/:code/available-members", async (req, res) => {
  const group = await Group.findOne({
    code: req.params.code,
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const availableMembers = group.members.filter((member) => !member.user);

  res.json({ availableMembers });
});

router.post("/:code/create-member", async (req, res) => {
  const group = await Group.findOne({
    code: req.params.code,
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  group.members.push({
    nickname: req.body.member.nickname,
    user: req.body.member.user,
  });

  // await group.populate("members.user");
  // computeMemberFinancials(group);
  await group.save();

  const newMember = group.members[group.members.length - 1];
  res.json({
    data: {
      _id: newMember._id,
      nickname: newMember.nickname,
      user: newMember.user,
      owner: newMember.owner,
      share: newMember.share,
    },
  });
});

router.put("/:code/link-member/:id", authMiddleware, async (req, res) => {
  const group = await Group.findOne({
    code: req.params.code,
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const member = group.members.id(req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });

  if (member.user)
    return res.status(422).json({ error: "Member already taken" });

  const alreadyLinked = group.members.some(
    (m) =>
      m._id.toString() !== member._id.toString() &&
      m.user?.toString() === req.user.userId,
  );
  if (alreadyLinked)
    return res
      .status(422)
      .json({ error: "User already linked to another member" });

  member.user = req.user.userId;

  // await group.populate("members.user");
  // computeMemberFinancials(group);
  await group.save();

  res.json({
    data: {
      _id: member._id,
      nickname: member.nickname,
      user: member.user,
      owner: member.owner,
      share: member.share,
    },
  });
});

module.exports = router;
