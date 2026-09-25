const mongoose = require('mongoose')
const crypto = require('crypto')
const Decimal = require('decimal.js')

const memberSchema = mongoose.Schema(
  {
    nickname: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owner: { type: Boolean },
    share: Number
  },
  { timestamps: true }
)

const noteSchema = mongoose.Schema(
  {
    message: { type: String, required: true },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    }
  },
  { timestamps: true }
)

const listItemSchema = mongoose.Schema(
  {
    text: { type: String, required: true },
    checked: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const listSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    items: [listItemSchema]
  },
  { timestamps: true }
)

const eventSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'événement',
        'rendez-vous',
        'échéance',
        'anniversaire',
        'absence',
        'autre'
      ],
      default: 'événement'
    },
    date: { type: Date, required: true },
    endDate: { type: Date },
    recurrenceFrequency: {
      type: String,
      enum: [
        'day',
        'week',
        'two-weeks',
        'month',
        'three-months',
        'six-months',
        'year'
      ]
    },
    recurrenceEndDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    location: { type: String },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      }
    ]
  },
  { timestamps: true }
)

const groupSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    members: [memberSchema],
    notes: [noteSchema],
    lists: [listSchema],
    agenda: [eventSchema]
  },
  { timestamps: true }
)

groupSchema.methods.computeMemberFinancials = async function () {
  await this.populate('members.user')

  if (this.members.some((member) => !member.user)) {
    const equalShare = this.members.length
      ? Number((1 / this.members.length).toFixed(4))
      : 0
    this.members.forEach((m) => {
      m.share = equalShare
    })
  } else {
    const totalLeftover = this.members.reduce(
      (sum, m) => Decimal.add(sum, m.user?.leftover || 0),
      new Decimal(0)
    )

    this.members.forEach((m) => {
      m.share = totalLeftover.gt(0)
        ? Number(Decimal.div(m.user?.leftover || 0, totalLeftover).toFixed(4))
        : 0
    })
  }
}

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateCode () {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
  }
  return code
}

groupSchema.pre('validate', async function (next) {
  if (this.code) return next()
  let unique = false
  while (!unique) {
    this.code = generateCode()
    const existing = await Group.findOne({ code: this.code })
    if (!existing) unique = true
  }
  next()
})

const Group = mongoose.model('Group', groupSchema)

module.exports = Group
