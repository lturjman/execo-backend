var express = require("express");
var router = express.Router();
var membersRouter = require("./members");
var expensesRouter = require("./expenses");

require("../models/group");
const Group = require("../models/group");

router.get("/", (req, res) => {
  Group.find().then((data) => {
    res.json({ data });
  });
});

router.post("/", (req, res) => {
  Group.create(req.body.group).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", (req, res) => {
  Group.findByIdAndUpdate(req.params.id, req.body.group).then((data) => {
    res.json({ data });
  });
});

router.delete("/:id", (req, res) => {
  Group.findByIdAndDelete(req.params.id).then((data) => {
    res.json({ data });
  });
});

router.use("/:groupId/members", membersRouter);
router.use("/:memberId/expenses", expensesRouter);

module.exports = router;
