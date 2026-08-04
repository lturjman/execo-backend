var express = require("express");
var router = express.Router({ mergeParams: true });
const Decimal = require("decimal.js");
const Group = require("../models/group");

function computeMemberFinancials(group) {
  const totalLeftover = group.members.reduce(
    (sum, m) => Decimal.add(sum, m.user?.leftover || 0),
    new Decimal(0),
  );

  group.members.forEach((m) => {
    m.share = totalLeftover.gt(0)
      ? Number(Decimal.div(m.user?.leftover || 0, totalLeftover).toFixed(4))
      : 0;
  });
}

async function findGroup(req, res) {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return null;
  }
  return group;
}

router.get("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  await group.populate("members.user");
  computeMemberFinancials(group);
  await group.save();

  const data = group.members.map((m) => ({
    _id: m._id,
    nickname: m.nickname,
    user: m.user,
    owner: m.owner,
    leftover: m.user?.leftover || 0,
    share: m.share,
  }));
  res.json({ data });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  group.members.push({
    nickname: req.body.member.nickname,
    user: req.body.member.user,
    owner: req.body.member.owner,
  });

  await group.populate("members.user");
  computeMemberFinancials(group);
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

router.put("/:id", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  const member = group.members.id(req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });

  member.nickname = req.body.member.nickname;

  await group.populate("members.user");
  computeMemberFinancials(group);
  await group.save();

  res.json({
    data: {
      _id: member._id,
      nickname: member.nickname,
      user: member.user,
      owner: member.owner,
      leftover: member.user?.leftover || 0,
      share: member.share,
    },
  });
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  const member = group.members.id(req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });

  group.members.pull(req.params.id);
  await group.save();

  res.json({ data: { _id: req.params.id } });
});

module.exports = router;
