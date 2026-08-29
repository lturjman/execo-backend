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

function serializeList(list) {
  return {
    _id: list._id,
    title: list.title,
    member: list.member,
    items: list.items.map((item) => ({
      _id: item._id,
      text: item.text,
      checked: item.checked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

router.get("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  res.json({ data: group.lists.map(serializeList) });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  if (!req.body.title) {
    return res.status(400).json({ error: "Title is required" });
  }
  group.lists.push({ title: req.body.title, member: req.body.member });
  await group.save();
  const newList = group.lists[group.lists.length - 1];
  res.json({ data: serializeList(newList) });
});

router.put("/:id", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  const list = group.lists.id(req.params.id);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }
  if (req.body.title !== undefined) list.title = req.body.title;
  await group.save();
  res.json({ data: serializeList(list) });
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  const list = group.lists.id(req.params.id);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }
  group.lists.pull(req.params.id);
  await group.save();
  res.json({ data: { _id: req.params.id } });
});

router.post("/:id/items", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  const list = group.lists.id(req.params.id);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }
  if (!req.body.text) {
    return res.status(400).json({ error: "Text is required" });
  }
  list.items.push({ text: req.body.text });
  await group.save();
  const newItem = list.items[list.items.length - 1];
  res.json({
    data: {
      _id: newItem._id,
      text: newItem.text,
      checked: newItem.checked,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt,
    },
  });
});

router.put("/:id/items/:itemId", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  const list = group.lists.id(req.params.id);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }
  const item = list.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  if (req.body.text !== undefined) item.text = req.body.text;
  if (req.body.checked !== undefined) item.checked = req.body.checked;
  await group.save();
  res.json({
    data: {
      _id: item._id,
      text: item.text,
      checked: item.checked,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
  });
});

router.delete("/:id/items/:itemId", async (req, res) => {
  const group = await findGroup(req, res);
  if (!group) return;
  const list = group.lists.id(req.params.id);
  if (!list) {
    return res.status(404).json({ error: "List not found" });
  }
  const item = list.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  list.items.pull(req.params.itemId);
  await group.save();
  res.json({ data: { _id: req.params.itemId } });
});

module.exports = router;
