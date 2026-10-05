const mongoose = require('mongoose')
const Group = require('../models/group')

// Récupère le groupe depuis req.params.groupId
async function findGroup (req, res) {
  const { groupId } = req.params

  // Sans cette validation, findById throw une CastError sur un identifiant
  // malformé, forwarded par Express 5 vers l'error handler en 500.
  if (!mongoose.isValidObjectId(groupId)) {
    res.status(400).json({ error: 'Invalid group id' })
    return null
  }

  const group = await Group.findById(groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found' })
    return null
  }
  return group
}

module.exports = findGroup
