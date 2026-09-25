const mongoose = require('mongoose')

const MONGODB_URI = process.env.CONNECTION_STRING

async function connectDB () {
  if (mongoose.connection.readyState >= 1) return
  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      bufferCommands: false
    })
  }
  try {
    await global.mongooseConnectionPromise
  } catch (err) {
    global.mongooseConnectionPromise = null
    throw err
  }
}

module.exports = connectDB