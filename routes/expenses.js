var express = require("express");
var router = express.Router();

require("../models/group");
const Expense = require("../models/expense");

router.get("/", (req, res) => {
  Expense.find().then((data) => {
    res.json({ data });
  });
});

router.post("/", (req, res) => {
  Expense.create(req.body.expense).then((data) => {
    res.json({ data });
  });
});

router.put("/:id", (req, res) => {
  Expense.findByIdAndUpdate(req.params.id, req.body.expense).then((data) => {
    res.json({ data });
  });
});

router.delete("/:id", (req, res) => {
  Expense.findByIdAndDelete(req.params.id).then((data) => {
    res.json({ data });
  });
});

module.exports = router;
