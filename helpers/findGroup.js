const Group = require('../models/group')

// Récupère le groupe depuis req.params.groupId
async function findGroup (req, res) {
  const { groupId } = req.params

  const group = await Group.findById(groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found' })
    return null
  }
  return group
}

module.exports = findGroup
