const express = require('express')
const router = express.Router({ mergeParams: true })

const Expense = require('../models/expense')
const findGroup = require('../helpers/findGroup')

function attachMembers (expense, group) {
  const membersById = new Map(
    group.members.map((member) => [member._id.toString(), member])
  )

  const data = expense.toObject({ versionKey: false })

  data.debts = data.debts.map((debt) => ({
    ...debt,
    member: membersById.get(String(debt.member)) || debt.member
  }))

  data.credits = data.credits.map((credit) => ({
    ...credit,
    member: membersById.get(String(credit.member)) || credit.member
  }))

  return data
}

router.get('/', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return

  const expenses = await Expense.find({ group })

  res.json({ data: expenses.map((expense) => attachMembers(expense, group)) })
})

router.post('/', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return

  const expense = await Expense.create({
    ...req.body.expense,
    group
  })

  res.json({ data: attachMembers(expense, group) })
})

router.put('/:id', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, group },
    req.body.expense,
    {
      new: true
    }
  )

  res.json({ data: expense ? attachMembers(expense, group) : null })
})

router.delete('/:id', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return

  const expense = await Expense.findOneAndDelete({ _id: req.params.id, group })

  res.json({ data: expense })
})

module.exports = router
