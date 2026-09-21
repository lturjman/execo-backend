const mongoose = require('mongoose')

const connectionString = process.env.CONNECTION_STRING

function connectDB () {
  if (global.mongooseConnectionPromise) return global.mongooseConnectionPromise

  global.mongooseConnectionPromise = mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 6000,
    connectTimeoutMS: 6000,
    maxPoolSize: 10
  })

  global.mongooseConnectionPromise
    .then(() => console.log('Database connected'))
    .catch((error) => {
      console.error('MongoDB connection failed:', error)
      global.mongooseConnectionPromise = null
    })

  return global.mongooseConnectionPromise
}

connectDB()

module.exports = connectDB
