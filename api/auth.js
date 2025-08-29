require("dotenv").config({ path: ".env.development" });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "Utilisateur existe déjà" });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashed });
  await newUser.save();

  const token = jwt.sign(
    { userId: newUser._id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({
    msg: "Utilisateur créé et connecté",
    token,
    user: { id: newUser._id, email: newUser.email },
  });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Mot de passe incorrect" });

  // Génère le token JWT
  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    msg: "Connecté",
    token,
    user: { id: user._id, email: user.email },
  });
});

// Route protégée
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) return res.status(400).json({ msg: "Utilisateur introuvable" });
  res.json(user);
});

module.exports = router;
