require('dotenv').config({ path: '.env.development' })

const jwt = require('jsonwebtoken')
const User = require('../models/user')
const JWT_SECRET = process.env.JWT_SECRET

async function authMiddleware (req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ msg: 'Token manquant ou invalide' })
  }

  const token = authHeader.split(' ')[1]

  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return res.status(401).json({ msg: 'Token invalide ou expiré' })
  }

  const user = await User.findById(decoded.userId).select('tokenVersion')
  if (!user) return res.status(401).json({ msg: 'Utilisateur introuvable' })
  if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ msg: 'Session expirée, veuillez vous reconnecter' })
  }

  req.user = decoded // { userId, email, tokenVersion }
  next()
}

module.exports = authMiddleware
