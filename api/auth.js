require('dotenv').config({ path: '.env.development' })
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/user')
const Group = require('../models/group')
const authMiddleware = require('../middlewares/auth')
const { sendResetEmail } = require('../utils/mailer')

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'

const forgotRateLimit = new Map()

function checkRateLimit (key) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const max = 5
  const hits = (forgotRateLimit.get(key) || []).filter(t => now - t < windowMs)
  if (hits.length >= max) return false
  hits.push(now)
  forgotRateLimit.set(key, hits)
  return true
}

function hashToken (token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, monthlyRevenues, monthlyCharges } =
    req.body

  const existing = await User.findOne({ email })
  if (existing) return res.status(400).json({ msg: 'Utilisateur existe déjà' })

  const hashed = await bcrypt.hash(password, 10)
  const newUser = new User({
    username,
    email,
    password: hashed,
    monthlyRevenues,
    monthlyCharges
  })
  await newUser.save()

  const token = jwt.sign(
    {
      userId: newUser._id,
      email: newUser.email,
      tokenVersion: newUser.tokenVersion
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.status(200).json({
    msg: 'Utilisateur créé et connecté',
    token,
    user: { id: newUser._id, email: newUser.email }
  })
})

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' })

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) return res.status(400).json({ msg: 'Mot de passe incorrect' })

  // Génère le token JWT
  const token = jwt.sign(
    { userId: user._id, email: user.email, tokenVersion: user.tokenVersion },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    msg: 'Connecté',
    token,
    user: { id: user._id, email: user.email }
  })
})

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password')
  if (!user) return res.status(400).json({ msg: 'Utilisateur introuvable' })
  res.json({ data: user })
})

router.put('/me', authMiddleware, async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.user.userId }, req.body, {
    new: true
  }).select('-password')
  const groups = await Group.find({
    'members.user': user._id
  })

  await Promise.all(
    groups.map(async (group) => {
      await group.computeMemberFinancials()
      await group.save()
    })
  )
  return res.json({ data: user })
})

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.json({
      msg: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    })
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  if (!checkRateLimit(`${ip}:${email}`) || !checkRateLimit(`email:${email}`)) {
    return res.json({
      msg: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    })
  }

  const user = await User.findOne({ email })
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = hashToken(token)
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000)
    await user.save()

    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}`
    try {
      await sendResetEmail(user.email, resetUrl)
    } catch (err) {
      console.error('Erreur envoi email reset:', err.message)
    }
  }

  res.json({
    msg: 'Si cet email existe, un lien de réinitialisation a été envoyé'
  })
})

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ msg: 'Token et mot de passe requis' })
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ msg: 'Le mot de passe doit contenir au moins 8 caractères' })
  }

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() }
  })
  if (!user) {
    return res
      .status(400)
      .json({ msg: 'Lien invalide ou expiré. Veuillez refaire une demande.' })
  }

  user.password = await bcrypt.hash(password, 10)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  user.tokenVersion = (user.tokenVersion || 0) + 1
  await user.save()

  res.json({ msg: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' })
})

// Logout
router.post('/logout', (req, res) => {
  res.json({ msg: 'Déconnecté' })
})

module.exports = router
