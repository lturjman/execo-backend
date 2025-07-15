var express = require("express");
var router = express.Router();
var membersRouter = require("./members");
var expensesRouter = require("./expenses");
var paybacksRouter = require("./paybacks");
const authMiddleware = require("../middlewares/auth");

router.use(authMiddleware); // Protéger toutes les routes

require("../models/group");
const Group = require("../models/group");

// Récupérer les groupes de l'utilisateur connecté
router.get("/", (req, res) => {
  return Group.find({ user: req.user.userId }).then((data) => {
    res.json({ data });
  });
});

// Récupérer un groupe par son id / vérifier que le groupe appartient à l'utilisateur
router.get("/:id", (req, res) => {
  return Group.aggregate([
    // Jointure avec la collection members
    {
      $lookup: {
        from: "members", // nom de la collection MongoDB
        localField: "_id", // champ local dans Group
        foreignField: "groupId", // champ dans Member
        as: "members",
      },
    },
    // Filtrer les groupes où un des membres a ce userId
    {
      $match: {
        "members.userId": req.user.userId,
      },
    },
  ]).then((data) => {
    res.json({ data });
  });
});

// Créer un groupe pour l'utilisateur connecté
router.post("/", (req, res) => {
  const groupData = { ...req.body.group, user: req.user.userId };
  return Group.create(groupData).then((data) => {
    res.json({ data });
  });
});

// Modifier un groupe / vérifier que le groupe appartient à l'utilisateur
router.put("/:id", (req, res) => {
  return Group.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    req.body.group,
    { new: true }
  ).then((data) => {
    res.json({ data });
  });
});

// Supprimer un groupe / vérifier que le groupe appartient à l'utilisateur
router.delete("/:id", (req, res) => {
  return Group.findByIdAndDelete({
    _id: req.params.id,
    user: req.user.userId,
  }).then((data) => {
    res.json({ data });
  });
});

router.use("/:groupId/members", membersRouter);
router.use("/:groupId/expenses", expensesRouter);
router.use("/:groupId/paybacks", paybacksRouter);

module.exports = router;
