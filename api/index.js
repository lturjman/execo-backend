require('dotenv').config()
const connectDB = require('../models/connection')
const cors = require('cors')
const createError = require('http-errors')
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const groupsRouter = require('./groups')
const joinGroupRouter = require('./join-group')
const authRouter = require('./auth')

const app = express()

const FRONTEND_URL = process.env.FRONTEND_URL

const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

app.use(cors(corsOptions))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(async (_req, _res, next) => {
  try {
    await connectDB()
    next()
  } catch (e) {
    next(e)
  }
})

app.use('/groups', groupsRouter)
app.use('/join-group', joinGroupRouter)
app.use('/auth', authRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }))

    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors
    })
  }

  // Un ObjectId malformé est une faute de requête, pas une panne serveur.
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Identifiant invalide'
    })
  }

  // Base de données injoignable : 503, pas 500.
  if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseServerSelectionError'
  ) {
    return res.status(503).json({
      status: 'error',
      message: 'Service temporairement indisponible'
    })
  }

  console.error(err)

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  })
})

module.exports = app
