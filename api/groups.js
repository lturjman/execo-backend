const express = require('express')
const router = express.Router()
const membersRouter = require('./members')
const expensesRouter = require('./expenses')
const paybacksRouter = require('./paybacks')
const notesRouter = require('./notes')
const listsRouter = require('./lists')
const authMiddleware = require('../middlewares/auth')

router.use(authMiddleware) // Protéger toutes les routes

const Group = require('../models/group')
const User = require('../models/user')

// Récupérer les groupes de l'utilisateur connecté (propriétaire OU membre)
router.get('/', async (req, res) => {
  const data = await Group.find({
    'members.user': req.user.userId
  })

  res.json({ data })
})

// Récupérer un groupe par son id / vérifier que l'utilisateur est propriétaire ou membre
router.get('/:id', async (req, res) => {
  const data = await Group.findOne({
    _id: req.params.id,
    'members.user': req.user.userId
  })

  res.json({ data })
})

// Créer un groupe + ajouter le créateur comme premier membre
router.post('/', async (req, res) => {
  const user = await User.findById(req.user.userId)

  const group = new Group({
    ...req.body.group,
    user: user._id,
    members: [
      {
        nickname: user.username,
        user: user._id,
        owner: true
      }
    ]
  })

  await group.computeMemberFinancials()
  const data = await group.save()

  res.json({ data })
})

// Modifier un groupe / vérifier que le groupe appartient à l'utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { _id, members, user, ...updateData } = req.body.group
    const data = await Group.findOneAndUpdate(
      { _id: req.params.id, 'members.user': req.user.userId },
      updateData,
      { new: true }
    )
    res.json({ data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Supprimer un groupe / vérifier que le groupe appartient à l'utilisateur
router.delete('/:id', (req, res) => {
  return Group.findByIdAndDelete({
    _id: req.params.id,
    user: req.user.userId
  }).then((data) => {
    res.json({ data })
  })
})

router.use('/:groupId/members', membersRouter)
router.use('/:groupId/expenses', expensesRouter)
router.use('/:groupId/paybacks', paybacksRouter)
router.use('/:groupId/notes', notesRouter)
router.use('/:groupId/lists', listsRouter)

module.exports = router
