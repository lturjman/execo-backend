const express = require('express')
const router = express.Router({ mergeParams: true })
const findGroup = require('../helpers/findGroup')

const RECURRENCE_FREQUENCIES = [
  'day',
  'week',
  'two-weeks',
  'month',
  'three-months',
  'six-months',
  'year'
]

function serializeEvent (event) {
  return {
    _id: event._id,
    title: event.title,
    type: event.type || 'événement',
    date: event.date,
    endDate: event.endDate,
    recurrenceFrequency: event.recurrenceFrequency,
    recurrenceEndDate: event.recurrenceEndDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    member: event.member,
    members:
      event.members && event.members.length
        ? event.members
        : [event.member],
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  }
}

function toValidDate (value) {
  if (value === undefined || value === null) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseRecurrenceFrequency (value) {
  if (value === null || value === '') return null
  return RECURRENCE_FREQUENCIES.includes(value) ? value : false
}

router.get('/', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return
  res.json({ data: group.agenda.map(serializeEvent) })
})

router.post('/', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return
  if (!req.body.title) {
    return res.status(400).json({ error: 'Title is required' })
  }
  const date = toValidDate(req.body.date)
  if (!date) {
    return res.status(400).json({ error: 'Valid date is required' })
  }

  let endDate = null
  if (req.body.endDate) {
    endDate = toValidDate(req.body.endDate)
    if (!endDate) {
      return res.status(400).json({ error: 'Valid endDate is required' })
    }
  }

  const recurrenceFrequency =
    req.body.recurrenceFrequency === undefined
      ? null
      : parseRecurrenceFrequency(req.body.recurrenceFrequency)
  if (recurrenceFrequency === false) {
    return res.status(400).json({ error: 'Valid recurrenceFrequency is required' })
  }

  let recurrenceEndDate = null
  if (req.body.recurrenceEndDate) {
    recurrenceEndDate = toValidDate(req.body.recurrenceEndDate)
    if (!recurrenceEndDate) {
      return res.status(400).json({ error: 'Valid recurrenceEndDate is required' })
    }
  }
  if (recurrenceEndDate && !recurrenceFrequency) {
    return res
      .status(400)
      .json({ error: 'recurrenceFrequency is required with recurrenceEndDate' })
  }
  if (recurrenceEndDate && recurrenceEndDate < date) {
    return res
      .status(400)
      .json({ error: 'recurrenceEndDate cannot be before date' })
  }

  const eventData = {
    title: req.body.title,
    type: req.body.type,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    location: req.body.location,
    member: req.body.member,
    date,
    recurrenceFrequency,
    recurrenceEndDate
  }
  if (endDate) eventData.endDate = endDate
  eventData.members =
    Array.isArray(req.body.members) && req.body.members.length
      ? req.body.members
      : [req.body.member]
  group.agenda.push(eventData)
  await group.save()
  const newEvent = group.agenda[group.agenda.length - 1]
  res.json({ data: serializeEvent(newEvent) })
})

router.put('/:id', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return
  const event = group.agenda.id(req.params.id)
  if (!event) {
    return res.status(404).json({ error: 'Event not found' })
  }

  let date = event.date
  if (req.body.date !== undefined) {
    date = toValidDate(req.body.date)
    if (!date) {
      return res.status(400).json({ error: 'Valid date is required' })
    }
  }

  let endDate = event.endDate || null
  if (req.body.endDate !== undefined) {
    endDate = req.body.endDate ? toValidDate(req.body.endDate) : null
    if (req.body.endDate && !endDate) {
      return res.status(400).json({ error: 'Valid endDate is required' })
    }
  }

  let recurrenceFrequency = event.recurrenceFrequency
  if (req.body.recurrenceFrequency !== undefined) {
    recurrenceFrequency = parseRecurrenceFrequency(req.body.recurrenceFrequency)
    if (recurrenceFrequency === false) {
      return res
        .status(400)
        .json({ error: 'Valid recurrenceFrequency is required' })
    }
  }

  let recurrenceEndDate = event.recurrenceEndDate || null
  if (req.body.recurrenceEndDate !== undefined) {
    recurrenceEndDate = req.body.recurrenceEndDate
      ? toValidDate(req.body.recurrenceEndDate)
      : null
    if (req.body.recurrenceEndDate && !recurrenceEndDate) {
      return res
        .status(400)
        .json({ error: 'Valid recurrenceEndDate is required' })
    }
  }
  if (recurrenceEndDate && !recurrenceFrequency) {
    return res
      .status(400)
      .json({ error: 'recurrenceFrequency is required with recurrenceEndDate' })
  }
  if (recurrenceEndDate && recurrenceEndDate < date) {
    return res
      .status(400)
      .json({ error: 'recurrenceEndDate cannot be before date' })
  }

  if (req.body.title !== undefined) event.title = req.body.title
  if (req.body.type !== undefined && req.body.type !== '') event.type = req.body.type
  if (req.body.startTime !== undefined) event.startTime = req.body.startTime
  if (req.body.endTime !== undefined) event.endTime = req.body.endTime
  if (req.body.location !== undefined) event.location = req.body.location
  if (req.body.members !== undefined) event.members = req.body.members
  event.date = date
  if (req.body.endDate !== undefined) event.endDate = endDate
  if (req.body.recurrenceFrequency !== undefined) {
    event.recurrenceFrequency = recurrenceFrequency
  }
  if (req.body.recurrenceEndDate !== undefined) {
    event.recurrenceEndDate = recurrenceEndDate
  }
  await group.save()
  res.json({ data: serializeEvent(event) })
})

router.delete('/:id', async (req, res) => {
  const group = await findGroup(req, res)
  if (!group) return
  const event = group.agenda.id(req.params.id)
  if (!event) {
    return res.status(404).json({ error: 'Event not found' })
  }
  group.agenda.pull(req.params.id)
  await group.save()
  res.json({ data: { _id: req.params.id } })
})

module.exports = router