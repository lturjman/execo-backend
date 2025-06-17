var express = require("express");
var router = express.Router({ mergeParams: true });

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

  Member.find({ group }).then((data) => {
    res.json({ data });
  });
});

router.post("/", async (req, res) => {
  const group = await findGroup(req);

  Member.create({ ...req.body.member, group }).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", async (req, res) => {
  const group = await findGroup(req);

  Member.findOneAndUpdate({ group, _id: req.params.id }, req.body.member).then(
    (data) => {
      res.json({ data });
    }
  );
});

router.delete("/:id", async (req, res) => {
  const group = await findGroup(req);

  Member.findOneAndUpdate({ group, _id: req.params.id }).then((data) => {
    res.json({ data });
  });
});

module.exports = router;
