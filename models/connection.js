const mongoose = require('mongoose')

const MONGODB_URI = process.env.CONNECTION_STRING

async function connectDB () {
  // readyState 1 = connected, 2 = connecting, 3 = disconnecting.
  // Seul le court-circuit sur 1 est sûr : avec bufferCommands:false, une requête
  // émise pendant la connexion throw "Cannot call Model.find() before initial
  // connection is complete" et remonte en 500.
  if (mongoose.connection.readyState === 1) return

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      bufferCommands: false
    })
    // Évite un unhandledRejection si personne n'await la promesse avant le next tick.
    global.mongooseConnectionPromise.catch(() => {})
  }

  try {
    // asPromise() attend l'état "connected" même si une connexion est déjà en
    // cours, ce qui couvre le cas readyState === 2 avec promesse absente.
    await mongoose.connection.asPromise()
  } catch (err) {
    global.mongooseConnectionPromise = null
    throw err
  }
}

module.exports = connectDB