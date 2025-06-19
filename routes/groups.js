var express = require("express");
var router = express.Router();
var membersRouter = require("./members");
var expensesRouter = require("./expenses");

require("../models/group");
const Group = require("../models/group");

router.get("/", (req, res) => {
  return Group.find().then((data) => {
    res.json({ data });
  });
});

router.get("/:id", (req, res) => {
  return Group.findById(req.params.id).then((data) => {
    res.json({ data });
  });
});

router.post("/", (req, res) => {
  return Group.create(req.body.group).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", (req, res) => {
  return Group.findByIdAndUpdate(req.params.id, req.body.group, {
    new: true,
  }).then((data) => {
    res.json({ data });
  });
});

router.delete("/:id", (req, res) => {
  return Group.findByIdAndDelete(req.params.id).then((data) => {
    res.json({ data });
  });
});

router.use("/:groupId/members", membersRouter);
router.use("/:groupId/expenses", expensesRouter);

module.exports = router;
