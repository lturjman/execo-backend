var express = require("express");
var router = express.Router();
var membersRouter = require("./members");
var expensesRouter = require("./expenses");
var paybacksRouter = require("./paybacks");
const authMiddleware = require("../middlewares/auth");

router.use(authMiddleware); // Protéger toutes les routes

require("../models/group");
const Group = require("../models/group");
const User = require("../models/user");

// Récupérer les groupes de l'utilisateur connecté (propriétaire OU membre)
router.get("/", async (req, res) => {
  const data = await Group.find({
    "members.user": req.user.userId,
  });

  res.json({ data });
});

// Récupérer un groupe par son id / vérifier que l'utilisateur est propriétaire ou membre
router.get("/:id", async (req, res) => {
  const data = await Group.findOne({
    _id: req.params.id,
    "members.user": req.user.userId,
  });

  res.json({ data });
});

// Créer un groupe + ajouter le créateur comme premier membre
router.post("/", async (req, res) => {
  const user = await User.findById(req.user.userId);

  const group = await Group.create({
    ...req.body.group,
    user: user._id,
    members: [
      {
        nickname: user.username,
        user: user._id,
        owner: true,
      },
    ],
  });

  res.json({ data: group });
});

// Modifier un groupe / vérifier que le groupe appartient à l'utilisateur
router.put("/:id", (req, res) => {
  return Group.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    req.body.group,
    { new: true },
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
