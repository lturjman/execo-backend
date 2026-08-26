var express = require("express");
var router = express.Router({ mergeParams: true });
const Group = require("../models/group");

async function findGroup(req, res) {
  const { groupId } = req.params;
  const group = await Group.findOne({
    _id: groupId,
    "members.user": req.user.userId,
  });
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return null;
  }
  return group;
}

router.get("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  res.json({ data: group.notes });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;

  if (!req.body.message) {
    return res.status(400).json({ error: "Message is required" });
  }

  group.notes.push({
    message: req.body.message,
    member: req.body.member,
  });

  await group.save();

  const newNote = group.notes[group.notes.length - 1];
  res.json({
    data: {
      _id: newNote._id,
      message: newNote.message,
      member: newNote.member,
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
    },
  });
});

async function findOwnNote(req, res) {
  const group = await findGroup(req, res);
  if (!group) return null;

  const member = group.members.find(
    (m) => m.user && m.user.toString() === req.user.userId,
  );
  const note = member ? group.notes.id(req.params.id) : null;

  if (!note || note.member.toString() !== member._id.toString()) {
    res.status(403).json({ error: "You can only modify your own notes" });
    return null;
  }

  return { group, note };
}

router.put("/:id", async (req, res) => {
  if (!req.body.message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const found = await findOwnNote(req, res);
  if (!found) return;
  const { group, note } = found;

  note.message = req.body.message;

  await group.save();

  res.json({
    data: {
      _id: note._id,
      message: note.message,
      member: note.member,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
  });
});

router.delete("/:id", async (req, res) => {
  const found = await findOwnNote(req, res);
  if (!found) return;
  const { group, note } = found;

  group.notes.pull(note._id);
  await group.save();

  res.json({ data: { _id: req.params.id } });
});

module.exports = router;
